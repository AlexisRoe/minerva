/**
 * The vocabulary the error registry and the screens share.
 *
 * Separate from `errors.registry.ts` so that a view can name a screen without
 * importing the whole registry -- and so that the values are named things rather
 * than string literals repeated at every comparison.
 */

/**
 * Which screen a failure belongs on.
 *
 * `NoContent` is not a lesser error screen -- it is the pane saying it cannot
 * run *here*, which is a different statement. Nothing has broken: the user is
 * outside Outlook, or on a client too old for the requirement set. It carries no
 * way out, by ui-lib's design, because there is nothing for the user to do.
 *
 * Named members rather than bare literals: the value is compared in the loader,
 * the registry and two views, and a typo in any of those would otherwise be a
 * silent `false` rather than a compile error.
 *
 * A frozen object plus a derived union, not a TypeScript `enum` -- `tsconfig`
 * sets `erasableSyntaxOnly`, so `enum` does not compile here. This reads the
 * same at every call site and, unlike an `enum`, the type is still assignable
 * from the raw string, which is what lets a code arriving in a query string be
 * compared without a cast.
 *
 * @example
 * ```ts
 * if (lookupErrorPolicy(error.code).screen === ErrorScreenKind.NoContent) {
 *   return redirect(ROUTES.unsupported);
 * }
 * ```
 */
export const ErrorScreenKind = Object.freeze({
  /** Something broke. The user gets the error screen, and possibly a retry. */
  Error: 'error',
  /** Nothing broke; the pane cannot run here. No button, because there is no move to make. */
  NoContent: 'no-content',
} as const);

/** The value side of {@link ErrorScreenKind}: one of its members. */
export type ErrorScreenKind = (typeof ErrorScreenKind)[keyof typeof ErrorScreenKind];
