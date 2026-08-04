import type { OutlookMessage } from '@/adapters/office/office.types';
import { OfficeNotReadyError } from '@/domain/errors/office.errors';

/**
 * Reads the message the task pane was opened on.
 *
 * Synchronous, and deliberately so. Waiting for the host is the start-up gate's
 * job -- `waitForOffice()` has already resolved by the time anything calls this,
 * so awaiting `Office.onReady()` again here would only hide the one case that
 * matters: being called *without* that gate. That now fails loudly, as
 * {@link OfficeNotReadyError}, instead of quietly returning `null` and being
 * read as "no message open".
 *
 * The two outcomes are kept distinct for the same reason. No mailbox is a wiring
 * fault and throws; no item is an ordinary situation -- the pane can be opened
 * on something that is not a read-mode message -- and answers `null`, which the
 * caller renders an empty state for.
 *
 * The item is read into a plain object rather than passed around, because
 * `Office.MessageRead`'s fields resolve only inside a host and only while the
 * item is still open.
 *
 * Note what else happens here: `item.itemId` is an EWS identifier on desktop and
 * cannot be handed to Graph, so it is converted once, at this boundary, and both
 * forms are carried. Converting later, at each call site, is how one of them
 * eventually gets missed.
 *
 * @returns The open message, or `null` when the pane is not on one.
 * @throws {OfficeNotReadyError} When called before the start-up gate has run.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.messageread} -- the item being narrowed
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/outlook/use-rest-api#get-the-item-id} -- why the id has to be converted
 *
 * @example
 * ```ts
 * await waitForOffice();
 * const message = readCurrentMessage();
 * ```
 */
export function readCurrentMessage(): OutlookMessage | null {
  const mailbox = typeof Office === 'undefined' ? undefined : Office.context?.mailbox;
  if (mailbox === undefined) {
    throw new OfficeNotReadyError('readCurrentMessage');
  }

  const item = mailbox.item as Office.MessageRead | undefined;
  if (!item?.itemId) {
    return null;
  }

  return {
    id: item.itemId,
    exchangeId: mailbox.convertToRestId(item.itemId, Office.MailboxEnums.RestVersion.v2_0),
    internetMessageId: item.internetMessageId ?? '',
    subject: item.subject,
    from: item.from?.emailAddress ?? '',
    receivedAt: item.dateTimeCreated.toISOString(),
  };
}
