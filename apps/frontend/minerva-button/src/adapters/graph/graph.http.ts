import { encodeAttachment } from '@/adapters/graph/utils/encode-attachment.util';
import { request } from '@/adapters/utils/request.util';
import { GRAPH_BASE_URL, MAX_CUSTOM_HEADERS } from '@/constants/graph-api.constants';
import { MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS } from '@/constants/request.constants';
import { GraphRequestFailedError } from '@/domain/errors/request.errors';
import type { AccessTokenProvider, GraphAdapter, NotificationMail, WellKnownFolder } from './graph.types';

/**
 * Builds the error every call in this adapter raises.
 *
 * @param path The Graph URL that failed.
 * @param status The HTTP status, or `0` when nothing answered.
 * @param cause The underlying `fetch` rejection, if there was one.
 * @returns The typed error to throw.
 *
 * @example
 * ```ts
 * throw failure(`${GRAPH_BASE_URL}/me/sendMail`, 403);
 * ```
 */
function failure(path: string, status: number, cause?: Error): GraphRequestFailedError {
  return new GraphRequestFailedError(path, status, cause);
}

/**
 * Turns a {@link NotificationMail} into the `sendMail` body Graph expects.
 *
 * @param mail The notification to serialise.
 * @returns The JSON body, with the attachment already base64-encoded.
 *
 * @see {@link https://learn.microsoft.com/graph/api/resources/message?view=graph-rest-1.0}
 * @see {@link https://learn.microsoft.com/graph/api/resources/fileattachment?view=graph-rest-1.0}
 *
 * @example
 * ```ts
 * const body = await toSendMailBody({ to, subject, bodyHtml, headers });
 * ```
 */
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
  /**
   * The `Authorization` header, with a freshly resolved token.
   *
   * @returns A header object to spread into a `RequestInit`.
   *
   * @example
   * ```ts
   * const headers = { ...(await authorization()), 'Content-Type': 'application/json' };
   * ```
   */
  async function authorization(): Promise<Record<string, string>> {
    return { Authorization: `Bearer ${await getAccessToken()}` };
  }

  return {
    /**
     * Downloads one message exactly as it arrived, as a `message/rfc822` blob.
     *
     * The raw MIME is what carries the headers a security team judges a report
     * by -- `Received`, SPF/DKIM results, the true sender -- none of which
     * survive a rendered or forwarded copy.
     *
     * @param exchangeId The Outlook item id of the message to fetch.
     * @returns The untouched `.eml` bytes, ready to attach.
     * @throws {GraphRequestFailedError} When Graph answers with a non-2xx status.
     * @throws {RequestTimedOutError} When the download outlives {@link MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS}.
     *
     * @see {@link https://learn.microsoft.com/graph/api/message-get?view=graph-rest-1.0#example-4-get-mime-content}
     *
     * @example
     * ```ts
     * const eml = await graph.getMimeMessage(item.itemId);
     * ```
     */
    async getMimeMessage(exchangeId: string): Promise<Blob> {
      const response = await request(
        `${GRAPH_BASE_URL}/me/messages/${encodeURIComponent(exchangeId)}/$value`,
        { method: 'GET', headers: await authorization() },
        failure,
        MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS,
      );

      // `$value` answers with the raw bytes rather than JSON, and Graph labels
      // them `text/plain`; re-typing here is what makes the .eml attach cleanly.
      return new Blob([await response.arrayBuffer()], { type: 'message/rfc822' });
    },

    /**
     * Sends the notification mail to the security department from the reporting
     * user's own mailbox.
     *
     * Sent as the user rather than from a service account on purpose: the
     * recipient sees who reported the message, and the user keeps a copy in
     * Sent Items as evidence the button did something.
     *
     * @param mail Recipient, subject, HTML body, provenance headers and the
     *   optional `.eml` attachment; see {@link NotificationMail}.
     * @returns Nothing -- Graph answers `202 Accepted` with an empty body.
     * @throws {GraphRequestFailedError} When Graph answers with a non-2xx status.
     * @throws {RequestTimedOutError} When the upload outlives {@link MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS}.
     *
     * @see {@link https://learn.microsoft.com/graph/api/user-sendmail?view=graph-rest-1.0}
     *
     * @example
     * ```ts
     * await graph.sendMail({ to: 'soc@contoso.example', subject, bodyHtml, headers });
     * ```
     */
    async sendMail(mail: NotificationMail): Promise<void> {
      await request(
        `${GRAPH_BASE_URL}/me/sendMail`,
        {
          method: 'POST',
          headers: { ...(await authorization()), 'Content-Type': 'application/json' },
          body: await toSendMailBody(mail),
        },
        failure,
        MESSAGE_TRANSFER_TIMEOUT_IN_MILLISECONDS,
      );
    },

    /**
     * Moves the reported message out of the inbox, into Junk Email or Deleted
     * Items.
     *
     * Addressed by well-known folder name rather than by folder id, because ids
     * differ per mailbox and would need a lookup call first.
     *
     * @param exchangeId The Outlook item id of the message to move.
     * @param destination The well-known folder to move it into.
     * @returns Nothing -- the moved copy Graph answers with is not needed.
     * @throws {GraphRequestFailedError} When Graph answers with a non-2xx status,
     *   including `404` for a message someone already moved or deleted.
     *
     * @see {@link https://learn.microsoft.com/graph/api/message-move?view=graph-rest-1.0}
     * @see {@link https://learn.microsoft.com/graph/api/resources/mailfolder?view=graph-rest-1.0#well-known-folder-names}
     *
     * @example
     * ```ts
     * await graph.moveMessage(item.itemId, 'junkemail');
     * ```
     */
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
