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
