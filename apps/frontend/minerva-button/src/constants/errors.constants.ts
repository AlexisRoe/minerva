import type { ErrorLogLevel } from '@minerva/typescript-lib';

/** Severity for anything that does not carry one of its own. */
export const DEFAULT_LEVEL = 'error';

/**
 * Which console method each {@link ErrorLogLevel} is written with.
 *
 * The same `logLevel` that picks the Sentry severity picks this, so an error is
 * exactly as loud in both places. `'fatal'` has no console method of its own and
 * shares `error`, which is already the loudest one there is.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/console}
 */
export const CONSOLE_METHOD: Record<ErrorLogLevel, 'log' | 'info' | 'debug' | 'warn' | 'error'> = {
  log: 'log',
  info: 'info',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

/** How many errors the log keeps before the oldest is dropped. */
export const ERROR_LOG_LIMIT = 25;

/** The `localStorage` key the log is persisted under. */
export const ERROR_LOG_STORAGE_KEY = 'minerva.button.error-log';
