import { OfficeNotReadyError } from '../../../errors';

/**
 * Closes the task pane.
 *
 * The end of the run. Once a mail has been reported and filed away there is
 * nothing left in the pane worth looking at, and leaving it open over the next
 * message would be worse than useless -- it would still be showing the previous
 * one.
 *
 * `closeContainer()` arrived in Mailbox 1.5, comfortably below the 1.13 the
 * start-up gate already requires, so it needs no capability check of its own.
 *
 * @throws {OfficeNotReadyError} When called before the start-up gate has run.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/office/office.ui#office-office-ui-closecontainer-member(1)}
 *
 * @example
 * ```ts
 * await graph.moveMessage(message.exchangeId, 'junkemail');
 * closePane();
 * ```
 */
export function closePane(): void {
  const ui = typeof Office === 'undefined' ? undefined : Office.context?.ui;

  if (ui === undefined) {
    throw new OfficeNotReadyError('closePane');
  }

  ui.closeContainer();
}
