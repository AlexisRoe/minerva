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
