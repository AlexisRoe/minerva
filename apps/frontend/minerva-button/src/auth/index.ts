/**
 * How the task pane signs the user in.
 *
 * Two flows, one entry point. Nested App Authentication is the real one -- the
 * Office host brokers the token, so the user is signed in already and nothing is
 * shown to them. The Office dialog is the fallback for clients too old to
 * broker, and it exists because a task pane is an iframe: it cannot be
 * redirected to Entra and back on its own.
 *
 * `acquireToken()` is the only thing outside this folder should call. Which flow
 * ran is a property of the host, decided once at start-up, and no caller has to
 * care which one won.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/enable-nested-app-authentication-in-your-add-in}
 */

export type { AuthFlow, AuthResult, DialogMessage } from './auth.types';
export { GRAPH_SCOPES, SHARED_GRAPH_SCOPES } from './auth.types';
export { acquireToken } from './utils/acquire-token.util';
export { AUTH_DIALOG_PATH, acquireTokenViaDialog, DIALOG_SIZE } from './utils/dialog.util';
export { AUTHORITY, acquireTokenViaNaa, resetNaaClients } from './utils/naa.util';
