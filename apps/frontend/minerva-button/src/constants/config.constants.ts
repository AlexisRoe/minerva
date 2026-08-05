/** The `retry` query parameter. */
export const RETRY_PARAM = 'retry';

/** The `demo` query parameter. */
export const DEMO_PARAM = 'demo';

/**
 * The highest `retry` the app will ever report.
 *
 * A second attempt is worth making because the failures this covers are
 * start-up ones -- a token that had just expired, a dialog that closed early.
 * A third would only repeat the first two, so anything above this is clamped
 * rather than trusted; the value reaches us from a URL a user can edit.
 */
export const MAX_RETRY = 1;

/** Default polling time to wait for OfficeJs to be loaded */
export const DEFAULT_OFFICE_TIMEOUT_IN_MS = 2500;

/** Default value extracted from OfficeJs */
export const DEFAULT_OFFICEJS_VALUE = 'n/a';

/**
 * The path the plugin publishes the document at.
 *
 * Deliberately duplicated from `CONFIG_PATH` in `vite.runtime-config.ts` rather
 * than imported: that module pulls in `node:fs` and `vite`, neither of which
 * belongs in a browser bundle.
 */
export const CONFIG_PATH = '/config.json';
