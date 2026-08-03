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
  /** Shown when a screen cannot be rendered, and for unknown paths. */
  error: '/error',
} as const;

/** One of the pane's paths. */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
