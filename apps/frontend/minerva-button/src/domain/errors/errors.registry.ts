import type { ErrorCode } from '@minerva/typescript-lib';

import type { TranslationKey } from '@/platform/i18n/utils/translate.util';
import { AuthClientIdMissingError, AuthDialogFailedError, TokenAcquisitionFailedError } from './auth.errors';
import {
  ConfigDomainMismatchError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigProviderMissingError,
  ConfigRequestFailedError,
  MissingRootElementError,
} from './config.errors';
import { ErrorScreenKind } from './errors.types';
import {
  OfficeHostUnsupportedError,
  OfficeLoadTimeoutError,
  OfficeNotReadyError,
  OfficeRequirementSetError,
} from './office.errors';
import { ReportNotificationFailedError } from './reporting.errors';
import { GraphRequestFailedError, MinervaRequestFailedError } from './request.errors';

/** What one entry of {@link errorRegistry} records about an error. */
export interface ErrorRegistryEntry {
  /** The class thrown for this code. */
  readonly error: new (
    ...args: never[]
  ) => Error;
  /** What the code means, for whoever meets it in a log or a Sentry issue. */
  readonly description: string;
  /** Where the user meets it. */
  readonly screen: ErrorScreenKind;
  /**
   * Whether trying again could plausibly help.
   *
   * `false` for anything a user cannot influence -- a broken deployment, an
   * unsupported host, a bug of ours. Offering a button that cannot work is worse
   * than offering none, because it invites the user to keep pressing it.
   *
   * Always `false` on a `no-content` screen: that view carries no button at all.
   */
  readonly canRetry: boolean;
  /**
   * What the screen says about it, as an i18n key.
   *
   * On an `error` screen this is advice; on a `no-content` screen it is the
   * explanation itself. Typed as {@link TranslationKey}, so a code cannot be
   * registered against a string the catalogues do not define.
   */
  readonly message: TranslationKey;
}

/**
 * Every error code this app can throw, in one place.
 *
 * The codes are what reaches a user, a log line and a Sentry fingerprint, so
 * they have to be unique and permanent. This map is what makes that checkable:
 * the next free code is the one after the last key, and a code that no longer
 * appears here has been removed rather than silently reused.
 *
 * It is also the one place that decides how a failure is *presented*. Which
 * screen it lands on, whether a retry is offered, and what the user is told all
 * live here rather than in the screens -- so those three answers cannot drift
 * apart, and adding an error means answering them once. Before this, the same
 * knowledge was spread across the start-up loader, the unsupported screen and
 * the error screen, each with its own map to keep in step.
 *
 * The keys are typed as {@link ErrorCode}, so a malformed code does not compile.
 * Adding an error means adding its class to one of the `*.errors.ts` files (with
 * a fresh `uuidgen` reference) and a line here.
 *
 * @example Looking one up from a report
 * ```ts
 * const { description } = errorRegistry.ERR_001;
 * ```
 *
 * @example Deciding what to render
 * ```ts
 * const entry = lookupError(error.code);
 * if (entry?.screen === 'no-content') redirect(ROUTES.unsupported);
 * ```
 */
export const errorRegistry = {
  ERR_001: {
    error: ConfigRequestFailedError,
    description: 'The runtime configuration could not be fetched at start-up.',
    screen: ErrorScreenKind.Error,
    canRetry: true,
    message: 'tip-network',
  },
  ERR_002: {
    error: ConfigParseError,
    description: 'The runtime configuration was served but is not JSON.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_003: {
    error: ConfigInvalidError,
    description: 'The runtime configuration does not match the expected shape.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_004: {
    error: MissingRootElementError,
    description: 'index.html has no #root element to mount React into.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_005: {
    error: ConfigProviderMissingError,
    description: 'useConfig() was called outside a ConfigProvider.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_006: {
    error: ConfigDomainMismatchError,
    description: 'The app is served from a host other than the configured appDomain.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_007: {
    error: OfficeLoadTimeoutError,
    description: 'Office.js did not become ready within the start-up timeout.',
    screen: ErrorScreenKind.NoContent,
    canRetry: false,
    message: 'unsupported-timeout',
  },
  ERR_008: {
    error: OfficeHostUnsupportedError,
    description: 'Office.js is ready, but the host application is not Outlook.',
    screen: ErrorScreenKind.NoContent,
    canRetry: false,
    message: 'unsupported-host',
  },
  ERR_009: {
    error: OfficeRequirementSetError,
    description: 'The Outlook client does not support the required Mailbox requirement set.',
    screen: ErrorScreenKind.NoContent,
    canRetry: false,
    message: 'unsupported-requirement-set',
  },
  ERR_010: {
    error: OfficeNotReadyError,
    description: 'The host was read before the start-up gate had awaited Office.js.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_011: {
    error: MinervaRequestFailedError,
    description: "Minerva's own API answered with a non-2xx status, or could not be reached.",
    screen: ErrorScreenKind.Error,
    canRetry: true,
    message: 'tip-network',
  },
  ERR_012: {
    error: GraphRequestFailedError,
    description: 'Microsoft Graph answered with a non-2xx status, or could not be reached.',
    screen: ErrorScreenKind.Error,
    canRetry: true,
    message: 'tip-network',
  },
  ERR_013: {
    error: AuthClientIdMissingError,
    description: 'Sign-in was attempted with no Entra client id configured.',
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-deployment',
  },
  ERR_014: {
    error: TokenAcquisitionFailedError,
    description: 'No Graph access token could be acquired, silently or interactively.',
    screen: ErrorScreenKind.Error,
    canRetry: true,
    message: 'tip-auth',
  },
  ERR_015: {
    error: AuthDialogFailedError,
    description: 'The Office sign-in dialog closed without returning a token.',
    screen: ErrorScreenKind.Error,
    canRetry: true,
    message: 'tip-auth',
  },
  ERR_016: {
    error: ReportNotificationFailedError,
    description: 'A tenant reporting method could not be notified after a report was filed.',
    // Listed for completeness rather than for a screen: this one is reported and
    // dropped, never thrown, so nothing ever looks its policy up. The
    // confirmation screen says what happened, per address.
    screen: ErrorScreenKind.Error,
    canRetry: false,
    message: 'tip-network',
  },
} as const satisfies Partial<Record<ErrorCode, ErrorRegistryEntry>>;

/** The codes actually in use, narrowed to the keys of {@link errorRegistry}. */
export type UsedErrorCode = keyof typeof errorRegistry;

/**
 * What the fallback entry says when a code is not in the registry.
 *
 * Reachable in one way that matters: an error thrown by a dependency, or by a
 * build older than the code it is reporting. It errs towards the safe answers --
 * the error screen, a retry allowed, generic advice -- because the alternative
 * is a blank screen with no way off it.
 */
export const UNKNOWN_ERROR_POLICY = {
  screen: ErrorScreenKind.Error,
  canRetry: true,
  message: 'tip-generic',
} as const satisfies Pick<ErrorRegistryEntry, 'screen' | 'canRetry' | 'message'>;

/**
 * Looks up how a failure should be presented, by code.
 *
 * Takes a plain `string` rather than a {@link UsedErrorCode} on purpose: the
 * caller usually has `error.code` off a `MinervaError`, or a code that arrived
 * in a query string, and neither is narrowed. An unregistered code falls back to
 * {@link UNKNOWN_ERROR_POLICY} rather than returning `undefined`, so no caller
 * has to handle a miss and no screen can end up with nothing to say.
 *
 * @param code The `ERR_xxx` the failure carries.
 * @returns How to present it.
 *
 * @example
 * ```ts
 * const { screen, canRetry, message } = lookupErrorPolicy(error.code);
 * ```
 */
export function lookupErrorPolicy(code: string): Pick<ErrorRegistryEntry, 'screen' | 'canRetry' | 'message'> {
  return errorRegistry[code as UsedErrorCode] ?? UNKNOWN_ERROR_POLICY;
}
