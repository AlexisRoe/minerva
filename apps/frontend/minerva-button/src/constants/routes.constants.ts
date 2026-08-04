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
   * Shown when the pane cannot run here at all.
   *
   * Distinct from {@link ROUTES.error} on purpose: nothing has gone wrong, the
   * pane is simply somewhere it does not work -- outside Outlook, on a client
   * that is too old, or with Office.js unreachable. There is nothing to retry,
   * so the screen explains rather than offering a way out.
   */
  unsupported: '/unsupported',
  /** Shown when a screen cannot be rendered, and for unknown paths. */
  error: '/error',
  /** Everything else */
  all: '*',
} as const;

/** The query parameter carrying *why* {@link ROUTES.unsupported} was reached. */
export const REASON_PARAM = 'reason';

/** One of the pane's paths. */
export type Route = (typeof ROUTES)[keyof typeof ROUTES];
