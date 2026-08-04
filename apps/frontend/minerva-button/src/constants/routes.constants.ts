/**
 * Every path the task pane can be on, in one place.
 *
 * The pane has no address bar, so these are never typed by a user — they exist
 * so a `navigate()` call and a route definition cannot drift apart, and so the
 * set of screens is readable without opening the router.
 *
 * @example
 * ```ts
 * navigate(ROUTES.confirmation);
 * ```
 */
export const ROUTES = {
  /** The pane's landing screen: the open message and the submit button. */
  taskPane: '/',
  /** Shown after a message was accepted by Minerva. */
  confirmation: '/confirmation',
  /**
   * Everything else.
   *
   * Nothing navigates here: the pane has two screens and a memory history that
   * starts on the first. It exists so a wiring mistake renders the error screen
   * rather than nothing at all.
   *
   * There is no `/unsupported` and no `/error` any more. A pane that cannot run
   * where it was opened now throws from the start-up loader, and the error
   * screen reads the error registry to decide whether that is a failure or
   * simply the wrong place -- so the wording lives in one screen instead of two
   * that could disagree.
   */
  all: '*',
} as const;

/** One of the pane's paths. */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
