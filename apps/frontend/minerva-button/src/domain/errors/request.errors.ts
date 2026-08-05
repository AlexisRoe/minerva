import { MinervaError } from '@minerva/typescript-lib';

/**
 * The task pane's errors for calls that leave the browser.
 *
 * Two services answer the pane, and they fail for different reasons and are
 * fixed by different people: Minerva's own API is ours, Microsoft Graph is not.
 * Keeping one code per service is what lets a Sentry issue be routed without
 * reading the payload -- an `ERR_011` spike is a deployment of ours, an
 * `ERR_012` spike is a tenant, a scope or an outage upstream.
 *
 * Both carry the status and the path in the payload rather than in the message,
 * so the message stays the same string for every occurrence and the fingerprint
 * does not split per URL.
 *
 * @see {@link ./office.errors.ts} -- the same pattern, for the start-up gate
 */

/**
 * Minerva's API answered with a non-2xx status, or could not be reached at all.
 *
 * Covers both halves deliberately: from the pane's point of view a 503 and a
 * refused connection are the same event -- the backend is not answering -- and
 * neither is something the user can act on. `status` is `0` when the request
 * never got a response.
 */
export class MinervaRequestFailedError extends MinervaError {
  constructor(path: string, status: number, cause?: Error) {
    super({
      reference: '062700dc-07d8-4f83-a247-4675423e1b8a',
      code: 'ERR_011',
      message: 'Minerva is not answering.',
      logLevel: 'error',
      payload: { path, status },
      cause,
    });
  }
}

/**
 * A call was aborted because it outlived its timeout.
 *
 * Distinct from {@link MinervaRequestFailedError} and
 * {@link GraphRequestFailedError} on purpose: those say a service answered
 * badly, this says none of them answered in time. The pane sits in a task pane
 * beside a mailbox, so a call that hangs is worse than one that fails -- the
 * user is left with a spinner and no way to tell whether pressing again would
 * help. One code for both services is enough here because the remedy does not
 * differ, and the service is recoverable from `path`.
 *
 * @see {@link https://developer.mozilla.org/docs/Web/API/AbortController}
 */
export class RequestTimedOutError extends MinervaError {
  constructor(path: string, timeoutInMilliseconds: number, cause?: Error) {
    super({
      reference: '48732d3d-da62-4a7b-82c7-f89716b9ce5d',
      code: 'ERR_020',
      message: 'The request took too long to answer.',
      logLevel: 'error',
      payload: { path, timeoutInMilliseconds },
      cause,
    });
  }
}

/**
 * Microsoft Graph answered with a non-2xx status, or could not be reached.
 *
 * The common causes are all authorisation rather than availability: a token
 * that expired between acquisition and use, a scope the tenant never consented
 * to, or a mailbox the signed-in user may not read. The status is what
 * separates them, so it is always recorded.
 *
 * @see {@link https://learn.microsoft.com/graph/errors}
 */
export class GraphRequestFailedError extends MinervaError {
  constructor(path: string, status: number, cause?: Error) {
    super({
      reference: '21824843-60bf-49be-9d02-59e19360ebab',
      code: 'ERR_012',
      message: 'Microsoft did not answer as expected.',
      logLevel: 'error',
      payload: { path, status },
      cause,
    });
  }
}
