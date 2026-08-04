/**
 * The snapshot `index.html` takes of the History API before Office.js loads.
 *
 * Declared on `Window` rather than passed in, because the only code that can
 * take it runs as an inline script in the document head -- long before any
 * module of this bundle is parsed.
 */
declare global {
  interface Window {
    __minervaHistoryApi?: {
      pushState: History['pushState'];
      replaceState: History['replaceState'];
    };
  }
}

/** The two methods a router needs and Office.js is known to remove. */
const METHODS = ['pushState', 'replaceState'] as const;

/**
 * Puts `history.pushState` and `history.replaceState` back if Office.js took them.
 *
 * Office.js overwrites both when it decides it is running outside an Office
 * client -- the same code path that logs "Office.js is loaded outside of Office
 * client". React Router reads them the moment a history is created, so
 * `createHashRouter` throws `globalHistory.replaceState is not a function` and
 * the pane never mounts. That makes the whole app unopenable in a plain browser,
 * which is exactly how demo mode is meant to be used.
 *
 * Restoring is safe inside Outlook too: this only ever reinstalls a function
 * where Office.js left something that is not callable, so a host that leaves the
 * API alone is untouched.
 *
 * Call it before building the router, and after Office.js has run.
 *
 * @see {@link https://learn.microsoft.com/office/dev/add-ins/develop/loading-the-dom-and-runtime-environment}
 *
 * @example
 * ```ts
 * restoreHistoryApi();
 * const router = createHashRouter(routes);
 * ```
 */
export function restoreHistoryApi(): void {
  if (typeof window === 'undefined' || typeof window.history !== 'object' || window.history === null) {
    return;
  }

  for (const method of METHODS) {
    if (typeof window.history[method] === 'function') {
      continue;
    }

    // The snapshot is already bound to the `history` it was read from; the
    // fallback is not, and the native implementation throws on a foreign `this`.
    window.history[method] = window.__minervaHistoryApi?.[method] ?? History.prototype[method].bind(window.history);
  }
}
