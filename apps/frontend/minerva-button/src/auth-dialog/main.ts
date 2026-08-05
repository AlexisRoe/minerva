import { PublicClientApplication } from '@azure/msal-browser';

// Imported from the file rather than the adapter barrel, which would pull React
// and the whole Office adapter into this page's bundle for one function.
import { restoreHistoryApi } from '@/adapters/office/utils/restore-history-api.util';
import type { DialogMessage } from '@/auth-dialog/types/auth.types';
import { AUTHORITY, GRAPH_SCOPES } from '@/constants/authentication.constants';

/**
 * Entry point of the `/auth-dialog` page.
 *
 * Opened by Office through `displayDialogAsync` on clients without Nested App
 * Authentication. Unlike the task pane this is a real top-level window, which is
 * the entire point: it can be redirected to Entra and back, and a task pane
 * iframe cannot.
 *
 * The flow is deliberately a redirect rather than a popup. A popup opened from
 * inside an Office dialog is a second nested window, which several Outlook
 * clients block outright.
 *
 * Whatever happens, exactly one message goes back through `messageParent` --
 * the failures included. The pane is waiting on that relay and it is the only
 * channel there is: nothing can be thrown across a document boundary.
 *
 * `@types/office-js` is in the workspace and in `tsconfig.json`'s `types`, so the
 * `Office` global is typed here with no local declaration of its own.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/auth-with-office-dialog-api}
 */

/** Posts one message back to the task pane. */
function reply(message: DialogMessage): void {
  Office.context.ui.messageParent(JSON.stringify(message));
}

/** Runs the redirect flow and relays whatever it produces. */
async function signIn(): Promise<void> {
  // MSAL clears the response hash through `history.replaceState`, which Office.js
  // removes on any client it does not recognise. Without this the redirect comes
  // back and then dies on the way to the token.
  restoreHistoryApi();

  // Passed by the pane rather than read from config.json: Office opens this page
  // as a bare URL, so it never boots the app's configuration loader.
  const clientId = new URLSearchParams(globalThis.location.search).get('clientId');

  if (clientId === null) {
    reply({ status: 'failure', reason: 'missing-client-id' });

    return;
  }

  try {
    const client = new PublicClientApplication({
      auth: { clientId, authority: AUTHORITY, redirectUri: globalThis.location.origin },
      cache: { cacheLocation: 'localStorage' },
    });

    await client.initialize();

    const request = { scopes: [...GRAPH_SCOPES] };

    // Set on the way back from Entra, and null on the first pass through this
    // page -- which is what tells us the redirect still has to be started.
    const redirect = await client.handleRedirectPromise();

    if (redirect !== null) {
      reply({ status: 'success', accessToken: redirect.accessToken });

      return;
    }

    const account = client.getAllAccounts()[0];

    if (account !== undefined) {
      const silent = await client.acquireTokenSilent({ ...request, account });

      reply({ status: 'success', accessToken: silent.accessToken });

      return;
    }

    // Navigates away; nothing after this runs until the page reloads on the way
    // back, at which point handleRedirectPromise above answers instead.
    await client.acquireTokenRedirect(request);
  } catch (cause) {
    reply({ status: 'failure', reason: cause instanceof Error ? cause.message : String(cause) });
  }
}

Office.onReady(() => {
  void signIn();
});
