import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';

import { SentryEnvironment } from '../interfaces/sentry.interface';

/** Share of transactions traced when nothing said otherwise. */
export const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

/**
 * Share of processes eligible to profile when nothing said otherwise. `1`
 * because it multiplies with {@link DEFAULT_TRACES_SAMPLE_RATE}.
 */
export const DEFAULT_PROFILE_SESSION_SAMPLE_RATE = 1;

/**
 * Reads `value` as a number, falling back only when it is unset or blank.
 *
 * Anything unreadable becomes `NaN` so `@IsNumber` names the variable, rather
 * than a fallback silently hiding the typo.
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
 * The two words are matched explicitly, because `Boolean('false')` is `true`.
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
 * Turns a raw environment into a validated {@link SentryEnvironment}, or
 * `undefined` when there is no `SENTRY_DSN` or the configuration is not legal.
 *
 * Never throws: the api not reporting is survivable. The report goes to
 * `console` rather than Nest's `Logger` because this runs before any Nest module
 * may be imported -- see `instrument.ts`. It names the broken variable and the
 * constraint it failed, never the message, which would quote the value the DSN
 * cannot afford to have printed.
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

  for (const { property, constraints } of errors) {
    console.warn(`[Sentry] ${property} failed: ${Object.keys(constraints ?? {}).join(', ')}.`);
  }

  console.warn('[Sentry] reporting is disabled because the configuration above is not valid.');

  return undefined;
}
