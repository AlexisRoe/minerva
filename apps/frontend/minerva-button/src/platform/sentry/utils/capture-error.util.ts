import { CONSOLE_METHOD, convertToSentryLevel, MinervaError } from '@minerva/typescript-lib';
import * as Sentry from '@sentry/react';
import { DEFAULT_LEVEL } from '@/constants/errors.constants';
import { useErrorLogStore } from '@/stores/error-log/error-log.store';

/**
 * The single way this app reports an error -- to Sentry, to the console and to
 * the persisted error log -- and answers with the Sentry event id.
 *
 * A {@link MinervaError} configures its own report: `logLevel` picks both the
 * Sentry severity and the console method, `code` and `reference` become tags and
 * the fingerprint, and `payload` travels as extra data. Anything else is
 * captured at {@link DEFAULT_LEVEL} without grouping.
 *
 * Safe to call before `Sentry.init()`; the SDK drops the event rather than
 * throwing, so the console line and the log entry survive either way. The event
 * id is what a user quotes and what support searches on -- `reference` names the
 * throw site and so groups, but does not identify one occurrence.
 *
 * @param error - Whatever a `catch` produced.
 * @returns The Sentry event id for this occurrence.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/usage/#capturing-errors}
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/usage/sdk-fingerprinting/}
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/enriching-events/context/} -- `extra` vs tags
 * @see {@link https://zustand.docs.pmnd.rs/integrations/persisting-store-data} -- how the log is kept
 *
 * @example
 * ```ts
 * try {
 *   await loadConfig();
 * } catch (error) {
 *   captureError(error);
 * }
 * ```
 */
export function captureError(error: unknown): string {
  useErrorLogStore.getState().log(error);

  if (!MinervaError.is(error)) {
    console.error('Minerva error', error);

    return Sentry.captureException(error, { level: DEFAULT_LEVEL });
  }

  console[error.logLevel ? CONSOLE_METHOD[error.logLevel] : DEFAULT_LEVEL](JSON.stringify(error));

  return Sentry.captureException(error, {
    level: error.logLevel ? convertToSentryLevel(error.logLevel) : DEFAULT_LEVEL,
    tags: { code: error.code, reference: error.reference },
    extra: error.payload,
    fingerprint: [error.code, error.reference],
  });
}
