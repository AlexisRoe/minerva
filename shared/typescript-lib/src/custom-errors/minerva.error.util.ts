import { isObjectLike } from '../validators/validator.utils';
import type { Cause, ErrorLogLevel } from './minerva.error.types';

/** Sentry's own `SeverityLevel` union, mirrored here so `@sentry/*` stays out of this package. */
export type SentryLevel = 'fatal' | 'error' | 'warning' | 'log' | 'info' | 'debug';

const SENTRY_LEVEL: Record<ErrorLogLevel, SentryLevel> = {
  log: 'log',
  info: 'info',
  debug: 'debug',
  warn: 'warning',
  error: 'error',
  fatal: 'fatal',
};

/**
 * Converts an internal {@link ErrorLogLevel} to a Sentry `SeverityLevel`.
 *
 * Every level maps onto one Sentry level; only `'warn'` changes name, because
 * Sentry calls it `'warning'`.
 *
 * @example
 * ```ts
 * const level = convertToSentryLevel(error.logLevel);
 * Sentry.captureException(error, { level, tags: { code: error.code } });
 * ```
 */
export function convertToSentryLevel(l: ErrorLogLevel): SentryLevel {
  return SENTRY_LEVEL[l];
}

/** The `console` methods an {@link ErrorLogLevel} can be written with. */
export type ConsoleMethod = 'log' | 'info' | 'debug' | 'warn' | 'error';

/** Nest's `Logger` methods, mirrored here so `@nestjs/*` stays out of this package. */
export type NestLoggerMethod = 'log' | 'debug' | 'warn' | 'error' | 'fatal';

/**
 * Which `console` method each {@link ErrorLogLevel} is written with, so an error
 * is exactly as loud on the console as it is in Sentry.
 *
 * A table rather than `console[level]`, because the console has no `fatal`.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/console
 */
export const CONSOLE_METHOD: Record<ErrorLogLevel, ConsoleMethod> = {
  log: 'log',
  info: 'info',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
  fatal: 'error',
};

/**
 * The backend counterpart of {@link CONSOLE_METHOD}. Separate tables, because
 * Nest has a `fatal` of its own and no `info`, where the console is the reverse.
 *
 * @see https://docs.nestjs.com/techniques/logger#log-levels
 */
export const NEST_LOGGER_METHOD: Record<ErrorLogLevel, NestLoggerMethod> = {
  log: 'log',
  info: 'log',
  debug: 'debug',
  warn: 'warn',
  error: 'error',
  fatal: 'fatal',
};

/** Flattens a `cause` to one serialisable level; non-`Error` causes are dropped. */
export function serializeCause(cause: unknown): Cause | undefined {
  return cause instanceof Error ? { name: cause.name, message: cause.message, stack: cause.stack } : undefined;
}

/** Property every `MinervaError` is branded with, so recognising one need not rely on `instanceof`. */
export const BRAND_KEY = '__brand';
/** The only value {@link BRAND_KEY} is ever set to. */
export const BRAND_VALUE = '__MinervaError__';

/** True when `e` carries the {@link BRAND_KEY} marker — realm-safe, unlike `instanceof`. */
export function hasMinervaBrand(e: unknown): boolean {
  return isObjectLike(e) && e[BRAND_KEY] === BRAND_VALUE;
}
