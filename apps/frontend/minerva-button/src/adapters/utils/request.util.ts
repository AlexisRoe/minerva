import type { MinervaError } from '@minerva/typescript-lib';

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
 * The status recorded when a request never got a response at all.
 *
 * `fetch` rejects rather than resolving for DNS failures, refused connections,
 * CORS rejections and offline devices, so there is no real status to record.
 * `0` is the same sentinel `XMLHttpRequest` uses for this, and it cannot
 * collide with an HTTP status.
 */
export const NO_RESPONSE_STATUS = 0;

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
 * @param path The absolute URL, or a same-origin path for Minerva's API.
 * @param init Whatever `fetch` should be given beyond the credentials mode.
 * @param failure Builds the error to throw; see {@link RequestFailure}.
 * @returns The successful response, undecoded.
 * @throws {MinervaError} Whatever `failure` builds, for a non-2xx status or an unreachable host.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/Window/fetch}
 * @see {@link https://developer.mozilla.org/docs/Web/API/RequestInit#credentials} -- why `include` is needed for the session cookie
 *
 * @example
 * ```ts
 * const response = await request('/api/button/settings', { method: 'GET' }, minervaFailure);
 * const settings = (await response.json()) as MinervaButtonSettings;
 * ```
 */
export async function request(path: string, init: RequestInit, failure: RequestFailure): Promise<Response> {
  let response: Response;

  try {
    response = await fetch(path, { ...init, credentials: 'include' });
  } catch (cause) {
    throw failure(path, NO_RESPONSE_STATUS, cause instanceof Error ? cause : new Error(String(cause)));
  }

  if (!response.ok) {
    throw failure(path, response.status);
  }

  return response;
}
