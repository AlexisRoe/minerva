import type { MinervaError } from '@minerva/typescript-lib';
import { DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS, NO_RESPONSE_STATUS } from '@/constants/request.constants';
import { RequestTimedOutError } from '@/domain/errors/request.errors';

/**
 * Builds the error a failed call should raise.
 *
 * Passed in rather than chosen here, so that one helper can serve both services
 * without knowing which one it is calling: `MinervaRequestFailedError` and
 * `GraphRequestFailedError` share this signature precisely so they are
 * interchangeable at this seam.
 */
export type RequestFailure = (path: string, status: number, cause?: Error) => MinervaError;

/**
 * Performs one HTTP call and turns anything other than success into a
 * {@link MinervaError}.
 *
 * This is the only place either adapter touches `fetch`. Two things are
 * therefore guaranteed for every call the pane makes rather than remembered at
 * each site: the session cookie is sent (it is httpOnly and set by the backend,
 * so `credentials: 'include'` is the only way it travels), and a failure is a
 * typed error with a code rather than a bare `Error` or -- worse -- a `Response`
 * nobody checked `ok` on.
 *
 * The `Response` is returned undecoded because the callers do not agree on a
 * body: settings are JSON, a MIME download is a `Blob`, and `sendMail` answers
 * `202` with nothing at all.
 *
 * A call that never answers is aborted rather than awaited forever. `fetch` has
 * no timeout of its own, and the pane cannot afford one: it is a task pane beside
 * an open mailbox, so a hung call leaves a spinner the user can neither cancel
 * nor interpret. The abort raises a {@link RequestTimedOutError} rather than the
 * caller's `failure`, because "nobody answered in time" is a different event from
 * "the service answered badly" and only the first is worth waiting on again.
 *
 * @param path The absolute URL, or a same-origin path for Minerva's API.
 * @param init Whatever `fetch` should be given beyond the credentials mode.
 * @param failure Builds the error to throw; see {@link RequestFailure}.
 * @param timeoutInMilliseconds How long to wait before aborting; defaults to
 *   {@link DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS}.
 * @returns The successful response, undecoded.
 * @throws {MinervaError} Whatever `failure` builds, for a non-2xx status or an unreachable host.
 * @throws {RequestTimedOutError} When the call outlives `timeoutInMilliseconds`.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/Window/fetch}
 * @see {@link https://developer.mozilla.org/docs/Web/API/RequestInit#credentials} -- why `include` is needed for the session cookie
 * @see {@link https://developer.mozilla.org/docs/Web/API/AbortController}
 *
 * @example
 * ```ts
 * const response = await request('/api/button/settings', { method: 'GET' }, minervaFailure);
 * const settings = (await response.json()) as MinervaButtonSettings;
 * ```
 *
 * @example Giving a slow call more room
 * ```ts
 * await request('/api/button/report', { method: 'POST', body }, minervaFailure, 10 * ONE_SECOND);
 * ```
 */
export async function request(
  path: string,
  init: RequestInit,
  failure: RequestFailure,
  timeoutInMilliseconds: number = DEFAULT_REQUEST_TIMEOUT_IN_MILLISECONDS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutInMilliseconds);

  let response: Response;

  try {
    response = await fetch(path, { ...init, credentials: 'include', signal: controller.signal });
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));

    if (controller.signal.aborted) {
      throw new RequestTimedOutError(path, timeoutInMilliseconds, error);
    }

    throw failure(path, NO_RESPONSE_STATUS, error);
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    throw failure(path, response.status);
  }

  return response;
}
