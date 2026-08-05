import { ONE_SECOND } from '@minerva/typescript-lib';

/**
 * The Outlook API surface the pane is written against.
 *
 * 1.13 is what `manifest/manifest.local.xml` declares in its V1_1 version
 * overrides, and the two have to agree: the manifest decides where the add-in is
 * offered, this decides where it will actually run. Raising one without the
 * other either hides the add-in from clients that could run it, or admits
 * clients that cannot.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/requirement-sets/outlook/requirement-set-1.13/outlook-requirement-set-1.13}
 */
export const MAILBOX_REQUIREMENT_SET = { name: 'Mailbox', minVersion: '1.13' } as const;

/**
 * The requirement set that decides whether the pane can use NAA to sign in.
 *
 * Checked separately from {@link MAILBOX_REQUIREMENT_SET} and never fatal: it
 * is versioned on its own, is not declarable in the manifest, and its absence
 * selects the Office dialog fallback rather than ending start-up.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/requirement-sets/common/nested-app-auth-requirement-sets}
 */
export const NAA_REQUIREMENT_SET = { name: 'NestedAppAuth', minVersion: '1.1' } as const;

/**
 * How long the pane waits for Office.js before giving up, in milliseconds.
 *
 * Long enough for the CDN on a slow connection, short enough that a user facing
 * a blocked one is not left watching a spinner.
 */
export const OFFICE_READY_TIMEOUT_MS = 5 * ONE_SECOND;

/**
 * How soon after the first miss the `Office` global is looked for again.
 *
 * Deliberately shorter than a fixed interval would be. The CDN tag is deferred
 * and so ordered ahead of the bundle, which means the global is normally already
 * there on the very first check and the common case costs nothing; when it is
 * not, it usually arrives within a few milliseconds, and a coarse interval would
 * spend most of that waiting for nothing.
 */
export const POLL_INITIAL_DELAY_MS = 10;

/**
 * The longest the poll ever waits between two checks, in milliseconds.
 *
 * Caps the growth from {@link POLL_BACKOFF_MULTIPLIER}: past this point the
 * global is not arriving late, it is not arriving at all, and the only thing
 * still worth bounding is how long after it does appear the pane notices.
 */
export const POLL_MAX_DELAY_MS = 100;

/**
 * The factor each poll interval grows by until it reaches
 * {@link POLL_MAX_DELAY_MS}.
 *
 * Backing off rather than polling flat keeps the checks dense where the global
 * realistically appears and sparse afterwards, so a blocked CDN costs a handful
 * of wake-ups over the deadline instead of a hundred.
 */
export const POLL_BACKOFF_MULTIPLIER = 1.5;
