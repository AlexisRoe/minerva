/**
 * The Graph permissions the pane needs, in the order Entra will be asked for them.
 *
 * These mirror the `<Scopes>` block of `manifest/manifest.local.xml`, and have
 * to: the host brokers the token for the application the manifest declares, so a
 * scope requested here but missing there is refused at the broker rather than at
 * Entra, with a message that says very little.
 *
 * The list omits `openid`, `profile` and `offline_access` on purpose. MSAL adds
 * them itself, and a request made up *only* of those is rejected -- at least one
 * resource scope has to be present, which is why they are not worth listing.
 *
 * @see {@link https://learn.microsoft.com/graph/permissions-reference}
 */
export const GRAPH_SCOPES = ['User.Read', 'Mail.Read', 'Mail.ReadWrite', 'Mail.Send'] as const;

/**
 * The same permissions for a mailbox the user does not own.
 *
 * A delegate or shared mailbox is read through the `.Shared` variants; the plain
 * ones only ever reach the signed-in user's own mail. Which set applies is a
 * property of the open item, not of the user, so it is decided per pane.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/outlook/delegate-access}
 */
export const SHARED_GRAPH_SCOPES = [
  'User.Read',
  'Mail.Read.Shared',
  'Mail.ReadWrite.Shared',
  'Mail.Send.Shared',
] as const;

/**
 * The authority every sign-in goes to.
 *
 * `/common` rather than a tenant id: the add-in is installed by whichever tenant
 * deploys it, and hard-coding one would make the artefact per-customer.
 */
export const AUTHORITY = 'https://login.microsoftonline.com/common';

/** Where the sign-in page lives, relative to the deployed pane. */
export const AUTH_DIALOG_PATH = '/auth-dialog.html';

/** How much of the screen the dialog takes, as a percentage. */
export const DIALOG_SIZE = { height: 60, width: 30 } as const;
