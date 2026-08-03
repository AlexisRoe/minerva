import { MinervaError } from '@minerva/typescript-lib';

import type { LoggedError } from './error-log.types';

/**
 * Flattens anything a `catch` produced into a storable {@link LoggedError}.
 *
 * A `MinervaError` already knows how to serialise itself, and that is used as
 * is -- code, reference, status, level, payload and a flattened cause all come
 * along. A plain `Error` gives up its name, message and stack. A thrown
 * non-error (a string, an object, `undefined`) still has to end up as something
 * the debug page can render, so it is stringified rather than dropped: an entry
 * saying `"boom"` is worth more than a gap in the log.
 *
 * @param error - Whatever was caught.
 * @param id - Entry id; injected so tests are not at the mercy of `randomUUID`.
 * @param loggedAt - ISO capture time, injected for the same reason.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify}
 *
 * @example
 * ```ts
 * const entry = toLoggedError(error, crypto.randomUUID(), new Date().toISOString());
 * ```
 */
export function toLoggedError(error: unknown, id: string, loggedAt: string): LoggedError {
  if (MinervaError.is(error)) {
    return { ...error.toJSON(), id, loggedAt };
  }

  if (error instanceof Error) {
    return { id, loggedAt, name: error.name, message: error.message, stack: error.stack };
  }

  return { id, loggedAt, name: 'UnknownError', message: String(error) };
}
