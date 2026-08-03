import { GRAPH_BASE_URL, type MessageBody } from '../graph.types';

/**
 * Fetches the body of one message from Microsoft Graph.
 *
 * `$select=body` is not decoration: the full `message` resource is large, and
 * the pane only ever needs the body Office.js will not give it in read mode.
 * The access token is passed in rather than acquired here, so token handling
 * stays in one place once `auth-dialog/` owns it.
 *
 * @param messageId The Office.js `itemId` of the message to read.
 * @param accessToken A bearer token with `Mail.Read`.
 * @returns The message body.
 * @throws {Error} When Graph answers with a non-2xx status.
 *
 * @see {@link https://learn.microsoft.com/graph/api/message-get}
 *
 * @example
 * ```ts
 * const body = await readMessageBody(message.id, token);
 * ```
 */
export async function readMessageBody(messageId: string, accessToken: string): Promise<MessageBody> {
  const response = await fetch(`${GRAPH_BASE_URL}/me/messages/${messageId}?$select=body`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Graph answered ${response.status} for message ${messageId}.`);
  }

  const payload = (await response.json()) as { body: MessageBody };

  return payload.body;
}
