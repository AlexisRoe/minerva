import type { OutlookMessage } from '../office.types';

/**
 * Reads the message the task pane was opened on.
 *
 * `Office.onReady()` is awaited rather than assumed: the pane's bundle is
 * parsed before the host has finished handing over `Office.context`, so reading
 * `mailbox.item` at import time gets `undefined`. A pane opened on something
 * that is not a read-mode message has no item at all, which is why the return
 * type is nullable — the caller renders an empty state rather than failing.
 *
 * This is the only place in the app that touches the `Office` global.
 *
 * @returns The open message, or `null` when the pane is not on one.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/office#office-office-onready-function} -- the readiness gate
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.messageread} -- the item being narrowed
 *
 * @example
 * ```ts
 * const message = await readCurrentMessage();
 * ```
 */
export async function readCurrentMessage(): Promise<OutlookMessage | null> {
  await Office.onReady();

  const item = Office.context?.mailbox?.item as Office.MessageRead | undefined;
  if (!item?.itemId) {
    return null;
  }

  return {
    id: item.itemId,
    subject: item.subject,
    from: item.from?.emailAddress ?? '',
    receivedAt: item.dateTimeCreated.toISOString(),
  };
}
