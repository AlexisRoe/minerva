import type { ErrorCode } from '@minerva/typescript-lib';

import { EnvironmentValidationError } from './environment.errors';
import { HttpRequestError, UnexpectedError } from './request.errors';

/** What one entry of {@link errorRegistry} records about an error. */
export interface ErrorRegistryEntry {
  /** The class thrown for this code. */
  readonly error: new (
    ...args: never[]
  ) => Error;
  /** What the code means, for whoever meets it in a log or a Sentry issue. */
  readonly description: string;
}

/**
 * Every error code this service can throw, in one place, so the next free code
 * is the one after the last key and a removed code is never reused.
 *
 * Adding an error means adding its class to a `*.errors.ts` file with a fresh
 * `uuidgen` reference, and a line here.
 *
 * @example Looking one up from a report
 * ```ts
 * const { description } = errorRegistry.ERR_001;
 * ```
 */
export const errorRegistry = {
  ERR_001: {
    error: EnvironmentValidationError,
    description: 'The environment does not satisfy the schema the api boots from.',
  },
  ERR_002: {
    error: HttpRequestError,
    description: 'A request was refused with an HTTP status Nest itself decided on.',
  },
  ERR_003: {
    error: UnexpectedError,
    description: 'A request failed on something the api does not recognise as an error of its own.',
  },
  // `Partial`, because what is enforced is that every key is a well-formed
  // code -- not that all thousand of them are taken.
} as const satisfies Partial<Record<ErrorCode, ErrorRegistryEntry>>;

/** The codes actually in use, narrowed to the keys of {@link errorRegistry}. */
export type UsedErrorCode = keyof typeof errorRegistry;
