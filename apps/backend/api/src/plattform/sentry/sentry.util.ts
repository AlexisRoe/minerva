import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { SentryEnvironment } from './sentry.interface';

/**
 * Share of transactions traced when nothing said otherwise.
 *
 * Production-shaped rather than off, because a reporting backend configured with
 * a DSN and then sampling nothing is a silent no-op nobody notices until they go
 * looking for a trace that was never taken.
 */
export const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

/**
 * Share of processes eligible to profile when nothing said otherwise.
 *
 * `1` rather than a fraction because this multiplies with
 * {@link DEFAULT_TRACES_SAMPLE_RATE} under the `trace` lifecycle: every process
 * may profile, but only for the tenth of transactions tracing already kept.
 */
export const DEFAULT_PROFILE_SESSION_SAMPLE_RATE = 1;

/**
 * Reads `value` as a number, keeping anything unreadable readable in the report.
 *
 * A bad number has to survive as far as validation rather than being swallowed
 * by a fallback, or `SENTRY_TRACES_SAMPLE_RATE=full` would silently become the
 * default and nobody would learn the variable is wrong. `NaN` is what
 * `@IsNumber` rejects, so it is exactly the right thing to hand it.
 *
 * @example
 * ```ts
 * toNumber('0.25', 0.1); // 0.25
 * toNumber(undefined, 0.1); // 0.1
 * toNumber('full', 0.1); // NaN -- rejected by validation
 * ```
 */
export function toNumber(value: string | undefined, fallback: number): number {
  const trimmed = value?.trim();

  return trimmed === undefined || trimmed === '' ? fallback : Number(trimmed);
}

/**
 * Reads `value` as a boolean, leaving anything else for validation to reject.
 *
 * `Boolean('false')` is `true`, which is the trap this exists to avoid: the
 * environment only ever supplies strings, so the two words have to be matched
 * explicitly. Anything else comes back as the raw string and fails `@IsBoolean`
 * with the variable named.
 *
 * @example
 * ```ts
 * toBoolean('true', false); // true
 * toBoolean(undefined, false); // false
 * toBoolean('yes', false); // 'yes' -- rejected by validation
 * ```
 */
export function toBoolean(value: string | undefined, fallback: boolean): boolean | string {
  const trimmed = value?.trim().toLowerCase();

  if (trimmed === undefined || trimmed === '') {
    return fallback;
  }

  if (trimmed === 'true' || trimmed === 'false') {
    return trimmed === 'true';
  }

  return trimmed;
}

/**
 * Turns a raw environment into a validated {@link SentryEnvironment}, or `undefined`.
 *
 * `undefined` comes back in the two cases where not reporting is the right
 * answer: no `SENTRY_DSN` at all, which is the normal state locally and is
 * silent, and an environment that named a variable but got it wrong, which is
 * warned about on `console` and then ignored. Neither throws -- an observability
 * backend the api could not reach is a bad reason for the api not to start.
 *
 * `console` rather than Nest's `Logger` on purpose: this runs before any Nest
 * module is imported, and importing one here to print a warning is exactly the
 * ordering `instrument.ts` exists to prevent.
 *
 * @example
 * ```ts
 * readSentryEnvironment({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2' });
 * // SentryEnvironment { tracesSampleRate: 0.1, profileSessionSampleRate: 1, enableLogs: false, ... }
 * ```
 *
 * @see https://github.com/typestack/class-validator#validation-errors
 */
export function readSentryEnvironment(environment: NodeJS.ProcessEnv): SentryEnvironment | undefined {
  const dsn = environment.SENTRY_DSN?.trim();

  if (dsn === undefined || dsn === '') {
    return undefined;
  }

  const candidate = plainToInstance(SentryEnvironment, {
    dsn,
    environment: environment.NODE_ENV?.trim() ?? 'development',
    tracesSampleRate: toNumber(environment.SENTRY_TRACES_SAMPLE_RATE, DEFAULT_TRACES_SAMPLE_RATE),
    profileSessionSampleRate: toNumber(
      environment.SENTRY_PROFILE_SESSION_SAMPLE_RATE,
      DEFAULT_PROFILE_SESSION_SAMPLE_RATE,
    ),
    enableLogs: toBoolean(environment.SENTRY_ENABLE_LOGS, false),
  });

  const errors = validateSync(candidate, { skipMissingProperties: false, forbidUnknownValues: false });

  if (errors.length === 0) {
    return candidate;
  }

  console.warn('[Sentry] reporting is disabled because the configuration above is not valid.');

  return undefined;
}
