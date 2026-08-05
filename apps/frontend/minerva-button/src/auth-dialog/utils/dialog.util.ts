import type { DialogMessage } from '@/auth-dialog/types/auth.types';
import { AUTH_DIALOG_PATH, DIALOG_SIZE } from '@/constants/authentication.constants';
import { AuthDialogFailedError } from '@/domain/errors/auth.errors';

/**
 * Acquires a Graph token through the Office dialog.
 *
 * The fallback for clients without Nested App Authentication. It exists because
 * a task pane is an iframe: it cannot open a normal popup that Entra will
 * redirect back into, so Office opens a real window for it and relays one string
 * back through `messageParent`.
 *
 * Everything about this shape follows from that relay being one-way and
 * stringly-typed. The dialog cannot throw across the boundary, so a failure
 * comes back as a `DialogMessage` with `status: 'failure'`; and the promise has
 * to settle on `DialogEventReceived` too, or a user who closes the window leaves
 * the pane waiting for ever on a message that will never arrive.
 *
 * @param clientId The Entra application to sign in to, passed on in the query string.
 * @returns A Graph access token.
 * @throws {AuthDialogFailedError} When the dialog cannot open, is closed, or reports a failure.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/auth-with-office-dialog-api}
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/dialog-handle-errors-events}
 *
 * @example
 * ```ts
 * const accessToken = await acquireTokenViaDialog(clientId);
 * ```
 */
export function acquireTokenViaDialog(clientId: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const url = new URL(AUTH_DIALOG_PATH, globalThis.location.href);
    url.searchParams.set('clientId', clientId);

    Office.context.ui.displayDialogAsync(url.toString(), { ...DIALOG_SIZE, displayInIframe: false }, (result) => {
      if (result.status !== Office.AsyncResultStatus.Succeeded) {
        reject(new AuthDialogFailedError(result.error?.message ?? 'could-not-open'));

        return;
      }

      const dialog = result.value;

      function settle(outcome: () => void): void {
        dialog.close();
        outcome();
      }

      dialog.addEventHandler(Office.EventType.DialogMessageReceived, (event) => {
        let message: DialogMessage;

        try {
          message = JSON.parse((event as { message: string }).message) as DialogMessage;
        } catch (cause) {
          settle(() =>
            reject(
              new AuthDialogFailedError(
                'unreadable-message',
                cause instanceof Error ? cause : new Error(String(cause)),
              ),
            ),
          );

          return;
        }

        settle(() =>
          message.status === 'success'
            ? resolve(message.accessToken)
            : reject(new AuthDialogFailedError(message.reason)),
        );
      });

      dialog.addEventHandler(Office.EventType.DialogEventReceived, (event) => {
        // 12006 is the user closing the window: ordinary, but still a dead end
        // for this boot, and nothing further will ever arrive on the relay.
        const code = (event as { error?: number }).error ?? 0;

        settle(() => reject(new AuthDialogFailedError(`dialog-event-${code}`)));
      });
    });
  });
}
