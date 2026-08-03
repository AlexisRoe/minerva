/**
 * The slice of the open Outlook item the task pane actually works with.
 *
 * `Office.MessageRead` carries far more than the pane needs, and reaches it
 * through getters that only resolve inside a host. Narrowing to a plain object
 * at the adapter boundary is what lets the views and their tests run without
 * Office.js loaded at all.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/outlook/office.messageread}
 */
export interface OutlookMessage {
  /** `item.itemId` — the identifier the Graph adapter is queried with. */
  readonly id: string;
  /** The message subject, shown to the user before they submit. */
  readonly subject: string;
  /** The sender's address, shown alongside the subject. */
  readonly from: string;
  /** When the message was received, as an ISO-8601 string. */
  readonly receivedAt: string;
}
