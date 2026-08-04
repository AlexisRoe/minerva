import type { ErrorCode } from '@minerva/typescript-lib';

import {
  ConfigDomainMismatchError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigProviderMissingError,
  ConfigRequestFailedError,
  MissingRootElementError,
} from './config.errors';
import {
  OfficeHostUnsupportedError,
  OfficeLoadTimeoutError,
  OfficeNotReadyError,
  OfficeRequirementSetError,
} from './office.errors';
import { GraphRequestFailedError, MinervaRequestFailedError } from './request.errors';

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
  ERR_006: {
    error: ConfigDomainMismatchError,
    description: 'The app is served from a host other than the configured appDomain.',
  },
  ERR_007: {
    error: OfficeLoadTimeoutError,
    description: 'Office.js did not become ready within the start-up timeout.',
  },
  ERR_008: {
    error: OfficeHostUnsupportedError,
    description: 'Office.js is ready, but the host application is not Outlook.',
  },
  ERR_009: {
    error: OfficeRequirementSetError,
    description: 'The Outlook client does not support the required Mailbox requirement set.',
  },
  ERR_010: {
    error: OfficeNotReadyError,
    description: 'The host was read before the start-up gate had awaited Office.js.',
  },
  ERR_011: {
    error: MinervaRequestFailedError,
    description: "Minerva's own API answered with a non-2xx status, or could not be reached.",
  },
  ERR_012: {
    error: GraphRequestFailedError,
    description: 'Microsoft Graph answered with a non-2xx status, or could not be reached.',
  },
} as const satisfies Partial<Record<ErrorCode, ErrorRegistryEntry>>;

/** The codes actually in use, narrowed to the keys of {@link errorRegistry}. */
export type UsedErrorCode = keyof typeof errorRegistry;
