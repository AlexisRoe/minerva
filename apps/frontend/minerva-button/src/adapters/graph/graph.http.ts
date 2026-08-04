import { encodeAttachment } from '@/adapters/graph/utils/encode-attachment.util';
import { request } from '@/adapters/utils/request.util';
import { GraphRequestFailedError } from '@/domain/errors/request.errors';
import {
  type AccessTokenProvider,
  GRAPH_BASE_URL,
  type GraphAdapter,
  type NotificationMail,
  type WellKnownFolder,
} from './graph.types';

/** The most `internetMessageHeaders` Graph will accept on one message. */
export const MAX_CUSTOM_HEADERS = 5;

/** Builds the error every call in this adapter raises. */
function failure(path: string, status: number, cause?: Error): GraphRequestFailedError {
  return new GraphRequestFailedError(path, status, cause);
}

/** Turns a {@link NotificationMail} into the `sendMail` body Graph expects. */
async function toSendMailBody(mail: NotificationMail): Promise<string> {
  const headers = Object.entries(mail.headers)
    .slice(0, MAX_CUSTOM_HEADERS)
    .map(([name, value]) => ({ name, value }));

  const attachments =
    mail.attachment === undefined
      ? []
      : [
          {
            // The OData type is not optional: without it Graph cannot tell which
            // kind of attachment this is and rejects the whole request.
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: mail.attachment.name,
            contentType: mail.attachment.contentType,
            contentBytes: await encodeAttachment(mail.attachment.content),
          },
        ];

  return JSON.stringify({
    message: {
      subject: mail.subject,
      body: { contentType: 'HTML', content: mail.bodyHtml },
      toRecipients: [{ emailAddress: { address: mail.to } }],
      internetMessageHeaders: headers,
      attachments,
    },
    // Kept, so a user who wonders what the button did can find the evidence in
    // their own Sent Items rather than having to take our word for it.
    saveToSentItems: true,
  });
}

/**
 * The real {@link GraphAdapter}, talking to Microsoft Graph over HTTP.
 *
 * The token is fetched per call rather than captured once: a pane can sit open
 * far longer than a token lives, and the provider is the only thing that knows
 * how to renew it. That costs nothing, because the provider caches.
 *
 * @param getAccessToken Supplies a Graph token with the manifest's scopes.
 * @returns The HTTP implementation of the Graph adapter.
 *
 * @see {@link ./graph.demo.ts} -- what stands in when `config.demo` is on
 *
 * @example
 * ```ts
 * const graph = createGraphHttpAdapter(getAccessToken);
 * ```
 */
export function createGraphHttpAdapter(getAccessToken: AccessTokenProvider): GraphAdapter {
  /** The `Authorization` header, with a freshly resolved token. */
  async function authorization(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await getAccessToken()}` };
  }

  return {
    async getMimeMessage(exchangeId: string): Promise<Blob> {
      const response = await request(
        `${GRAPH_BASE_URL}/me/messages/${encodeURIComponent(exchangeId)}/$value`,
        { method: 'GET', headers: await authorization() },
        failure,
      );

      // `$value` answers with the raw bytes rather than JSON, and Graph labels
      // them `text/plain`; re-typing here is what makes the .eml attach cleanly.
      return new Blob([await response.arrayBuffer()], { type: 'message/rfc822' });
    },

    async sendMail(mail: NotificationMail): Promise<void> {
      await request(
        `${GRAPH_BASE_URL}/me/sendMail`,
        {
          method: 'POST',
          headers: { ...(await authorization()), 'Content-Type': 'application/json' },
          body: await toSendMailBody(mail),
        },
        failure,
      );
    },

    async moveMessage(exchangeId: string, destination: WellKnownFolder): Promise<void> {
      await request(
        `${GRAPH_BASE_URL}/me/messages/${encodeURIComponent(exchangeId)}/move`,
        {
          method: 'POST',
          headers: { ...(await authorization()), 'Content-Type': 'application/json' },
          body: JSON.stringify({ destinationId: destination }),
        },
        failure,
      );
    },
  };
}
