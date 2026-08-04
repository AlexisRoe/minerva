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
 * Which of the two sign-in flows produced a token.
 *
 * Recorded rather than discarded because it changes what a failure means: `naa`
 * failing is a tenant or consent problem, `dialog` failing is usually a user
 * closing a window, and the two want different messages.
 */
export type AuthFlow = 'naa' | 'dialog';

/** What a completed sign-in hands back. */
export interface AuthResult {
  /** The Graph access token, ready for an `Authorization` header. */
  readonly accessToken: string;
  /** Which flow produced it. */
  readonly flow: AuthFlow;
}

/**
 * What the sign-in dialog posts back to the pane through `messageParent`.
 *
 * `messageParent` carries a string and nothing else, so both sides agree on this
 * shape and JSON. The failure case travels in-band rather than as a thrown
 * error, because the dialog is a separate document -- nothing can be thrown
 * across the boundary.
 */
export type DialogMessage =
  | { readonly status: 'success'; readonly accessToken: string }
  | { readonly status: 'failure'; readonly reason: string };
