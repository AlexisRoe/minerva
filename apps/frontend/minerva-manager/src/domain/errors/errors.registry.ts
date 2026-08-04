import type { ErrorCode } from '@minerva/typescript-lib';

import {
  ConfigInvalidError,
  ConfigParseError,
  ConfigProviderMissingError,
  ConfigRequestFailedError,
  MissingRootElementError,
} from './config.errors';

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
 * Every error code this app can throw, in one place.
 *
 * The codes are what reaches a user, a log line and a Sentry fingerprint, so
 * they have to be unique and permanent. This map is what makes that checkable:
 * the next free code is the one after the last key, and a code that no longer
 * appears here has been removed rather than silently reused.
 *
 * The keys are typed as {@link ErrorCode}, so a malformed code does not compile.
 * Adding an error means adding its class to `config.errors.ts` (with a fresh
 * `uuidgen` reference) and a line here.
 *
 * @example Looking one up from a report
 * ```ts
 * const { description } = errorRegistry.ERR_001;
 * ```
 */
export const errorRegistry = {
  ERR_001: {
    error: ConfigRequestFailedError,
    description: 'The runtime configuration could not be fetched at start-up.',
  },
  ERR_002: {
    error: ConfigParseError,
    description: 'The runtime configuration was served but is not JSON.',
  },
  ERR_003: {
    error: ConfigInvalidError,
    description: 'The runtime configuration does not match the expected shape.',
  },
  ERR_004: {
    error: MissingRootElementError,
    description: 'index.html has no #root element to mount React into.',
  },
  ERR_005: {
    error: ConfigProviderMissingError,
    description: 'useConfig() was called outside a ConfigProvider.',
  },
  // `Partial`, because what is enforced is that every key is a well-formed
  // code -- not that all thousand of them are taken.
} as const satisfies Partial<Record<ErrorCode, ErrorRegistryEntry>>;

/** The codes actually in use, narrowed to the keys of {@link errorRegistry}. */
export type UsedErrorCode = keyof typeof errorRegistry;
