import { randomUUID, type UUID } from 'node:crypto';
import { isString, isUUID } from 'class-validator';

/**
 * Settles the id of a request: the one the caller sent, or a minted one.
 *
 * The single rule `RequestIdMiddleware` and `@RequestId()` both read, so
 * whichever of the two runs first, the answer is the same. An incoming value is
 * only usable when it is a v4 uuid -- anything else is a caller's typo, and
 * honouring it would let one join two unrelated traces.
 *
 * @example
 * ```ts
 * toRequestId('3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31'); // the same id back
 * toRequestId('not-an-id'); // a freshly minted uuid
 * ```
 */
export function toRequestId(value: string | undefined): UUID {
  return isString(value) && isUUID(value, '4') ? (value as UUID) : randomUUID();
}
