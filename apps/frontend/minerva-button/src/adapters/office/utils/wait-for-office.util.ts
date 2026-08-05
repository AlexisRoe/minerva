import type { OfficeReadyInfo } from '@/adapters/office/office.types';
import {
  OFFICE_READY_TIMEOUT_MS,
  POLL_BACKOFF_MULTIPLIER,
  POLL_INITIAL_DELAY_MS,
  POLL_MAX_DELAY_MS,
} from '@/constants/office-js.constants';
import { OfficeHostUnsupportedError, OfficeLoadTimeoutError } from '@/domain/errors/office.errors';

/**
 * Whether the Office.js global has been installed and is usable.
 *
 * Both halves matter: the CDN tag can have executed far enough to define
 * `Office` while `onReady` is not on it yet, and calling it then throws rather
 * than waiting.
 *
 * @returns `true` once the global can be called.
 *
 * @example
 * ```ts
 * if (hasOfficeGlobal()) await Office.onReady();
 * ```
 */
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
 * The polling loop covers the first, and backs off as it goes: the script is
 * deferred and so ordered ahead of the bundle, so in practice the global is
 * already there on the first, immediate check, and the loop only means that a
 * change to that ordering degrades into a short wait rather than an immediate
 * false negative. Growing the interval keeps the checks dense where the global
 * realistically arrives without spending a hundred wake-ups on a CDN that is
 * simply blocked.
 *
 * Every timer is cleared on the way out of all four exits, and nothing settles
 * twice: a host that answers *after* the deadline has already been reported as a
 * timeout, and its late answer -- or its late rejection -- is dropped rather
 * than surfacing as an unhandled rejection in a pane the user has moved on from.
 *
 * @param timeoutMs How long to wait in total. Defaults to {@link OFFICE_READY_TIMEOUT_MS}.
 * @returns What the host reports about itself once it is ready.
 * @throws {OfficeLoadTimeoutError} When the deadline passes first, or when
 *   `Office.onReady()` rejects outright.
 * @throws {OfficeHostUnsupportedError} When Office.js loads but reports no host,
 *   which is what the page opened as an ordinary web page looks like from here.
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
export function waitForOffice(timeoutMs: number = OFFICE_READY_TIMEOUT_MS): Promise<OfficeReadyInfo> {
  return new Promise<OfficeReadyInfo>((resolve, reject) => {
    let settled = false;
    let asked = false;
    let pollTimer: ReturnType<typeof setTimeout> | undefined;
    let delay = POLL_INITIAL_DELAY_MS;

    const deadlineTimer = setTimeout(() => {
      cleanup();
      reject(new OfficeLoadTimeoutError(timeoutMs));
    }, timeoutMs);

    /** Marks the wait finished and drops both timers, whichever exit was taken. */
    function cleanup(): void {
      settled = true;
      clearTimeout(deadlineTimer);
      clearTimeout(pollTimer);
      pollTimer = undefined;
    }

    /** Asks the host once the global is there, and re-schedules itself until it is. */
    function poll(): void {
      if (settled || asked) {
        return;
      }

      try {
        if (hasOfficeGlobal()) {
          asked = true;
          clearTimeout(pollTimer);
          pollTimer = undefined;

          Promise.resolve(Office.onReady()).then(
            (info: OfficeReadyInfo) => {
              if (settled) {
                return;
              }
              cleanup();

              if (info.host === null) {
                reject(new OfficeHostUnsupportedError('unknown', 'unknown'));

                return;
              }

              resolve(info);
            },
            (cause: unknown) => {
              if (settled) {
                return;
              }
              cleanup();
              reject(new OfficeLoadTimeoutError(timeoutMs, cause instanceof Error ? cause : new Error(String(cause))));
            },
          );

          return;
        }
      } catch (cause) {
        cleanup();
        reject(new OfficeLoadTimeoutError(timeoutMs, cause instanceof Error ? cause : new Error(String(cause))));

        return;
      }

      pollTimer = setTimeout(poll, delay);
      delay = Math.min(Math.round(delay * POLL_BACKOFF_MULTIPLIER), POLL_MAX_DELAY_MS);
    }

    // The first check is immediate, because normally it is also the only one.
    poll();
  });
}
