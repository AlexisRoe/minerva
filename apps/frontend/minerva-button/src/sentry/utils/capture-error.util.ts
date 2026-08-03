import { convertToSentryLevel, MinervaError } from '@minerva/typescript-lib';
import * as Sentry from '@sentry/react';

import { useErrorLogStore } from '../../store';

/** Severity for anything that does not carry one of its own. */
const DEFAULT_LEVEL = 'error';

/**
 * Reports an error to Sentry and to the console, as loudly as it asks for.
 *
 * The single way this app hands an error to Sentry, so every event is enriched
 * the same way. A {@link MinervaError} configures its own report: `logLevel`
 * becomes the Sentry severity (`'error'` when it carries none), `code` and
 * `reference` become searchable tags *and* the fingerprint, and `payload`
 * travels as unindexed extra data. Fingerprinting on the pair is what makes
 * grouping predictable -- one throw site is one issue, regardless of how the
 * message is later reworded, and two sites sharing a code do not collapse into
 * each other.
 *
 * Anything else is captured at the default severity; it is still worth having,
 * just without the grouping. Both paths also log, because the DSN is unset in
 * local development and the console line is all there is.
 *
 * It also writes to the persisted error log, which is the copy that survives
 * when Sentry is off -- the usual case inside Outlook, where nobody can open a
 * console either. See `src/store/error-log/`.
 *
 * Safe to call before `Sentry.init()`: the SDK drops the event rather than
 * throwing, so the console line and the log entry survive either way.
 *
 * @param error - Whatever a `catch` produced.
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
export function captureError(error: unknown): void {
  useErrorLogStore.getState().log(error);

  if (!MinervaError.is(error)) {
    console.error('Minerva error', error);
    Sentry.captureException(error, { level: DEFAULT_LEVEL });
    return;
  }

  console.error(JSON.stringify(error));

  Sentry.captureException(error, {
    level: error.logLevel ? convertToSentryLevel(error.logLevel) : DEFAULT_LEVEL,
    tags: { code: error.code, reference: error.reference },
    extra: error.payload,
    fingerprint: [error.code, error.reference],
  });
}
