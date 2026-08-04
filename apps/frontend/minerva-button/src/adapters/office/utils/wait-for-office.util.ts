import type { OfficeReadyInfo } from '@/adapters/office/office.types';
import { OfficeLoadTimeoutError } from '@/domain/errors/office.errors';

/**
 * How long the pane waits for Office.js before giving up, in milliseconds.
 *
 * Long enough for the CDN on a slow connection, short enough that a user facing
 * a blocked one is not left watching a spinner.
 */
export const OFFICE_READY_TIMEOUT_MS = 5_000;

/** How often the `Office` global is looked for while it is still missing. */
const POLL_INTERVAL_MS = 50;

/** Resolves after `ms`, so the polling loop can yield between attempts. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Whether the Office.js global has been installed and is usable. */
function hasOfficeGlobal(): boolean {
  return typeof Office !== 'undefined' && typeof Office.onReady === 'function';
}

/**
 * Waits for Office.js to be installed and for the host to hand over its context.
 *
 * Two separate failures hide behind "Office.js did not load", and this waits out
 * both against one deadline. The global itself may never appear -- it comes from
 * a CDN tag in `index.html`, so a blocked or unreachable
 * `appsforoffice.microsoft.com` leaves `Office` undefined and any property
 * access on it throwing. And once it does appear, `Office.onReady()` is still a
 * round trip to the host, which is what actually populates `Office.context`.
 *
 * The polling loop covers the first: the script is deferred and so ordered ahead
 * of the bundle, so in practice the global is already there on the first check,
 * but the loop means a change to that ordering degrades into a wait rather than
 * an immediate false negative.
 *
 * @param timeoutMs How long to wait in total. Defaults to {@link OFFICE_READY_TIMEOUT_MS}.
 * @returns What the host reports about itself once it is ready.
 * @throws {OfficeLoadTimeoutError} When the deadline passes first.
 *
 * @see {@link https://learn.microsoft.com/javascript/api/office#office-office-onready-function} -- the readiness gate
 * @see {@link https://learn.microsoft.com/office/dev/office-js/initialize-add-in} -- why the wait is needed at all
 *
 * @example Gating a route loader on the host being ready
 * ```ts
 * const info = await waitForOffice();
 * const environment = readEnvironment(info);
 * ```
 */
export async function waitForOffice(timeoutMs: number = OFFICE_READY_TIMEOUT_MS): Promise<OfficeReadyInfo> {
  const deadline = Date.now() + timeoutMs;

  while (!hasOfficeGlobal()) {
    if (Date.now() >= deadline) {
      throw new OfficeLoadTimeoutError(timeoutMs);
    }
    await sleep(POLL_INTERVAL_MS);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  const expiry = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new OfficeLoadTimeoutError(timeoutMs)), Math.max(0, deadline - Date.now()));
  });

  try {
    // Widening only: OfficeReadyInfo is Office's own result type with `null`
    // added to each field, so what the host returns already satisfies it.
    return await Promise.race([Office.onReady(), expiry]);
  } finally {
    clearTimeout(timer);
  }
}
