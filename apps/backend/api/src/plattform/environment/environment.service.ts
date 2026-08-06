import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';
import { ENVIRONMENT_DEFAULTS, type EnvironmentVariables } from './environment.interface';

/**
 * Typed, read-only access to the environment this process booted with, and the
 * one place that decides what a variable the environment did not set means.
 *
 * Whatever comes back from here has already been through `validateEnvironment`
 * as the `validate` hook of `ConfigModule.forRoot`, so it is legal or the
 * process is already dead. What is left to settle is absence, and that is a
 * different question per variable: {@link apiPort} falls back to
 * {@link ENVIRONMENT_DEFAULTS}, {@link sentryDsn} does not fall back at all
 * because absent is a meaningful answer, and a variable with neither would have
 * failed validation for being required.
 *
 * Keeping that decision in the getters is the point. A default applied during
 * validation is invisible at the call site and impossible to opt out of;
 * applied here, each variable states its own rule once, in the type the rest of
 * the code consumes.
 *
 * This is also the only place in the api allowed to read configuration.
 * Reaching for `process.env` directly bypasses the validation and gives back a
 * string where the rest of the code expects a number.
 *
 * @example
 * ```ts
 * constructor(private readonly environment: EnvironmentService) {}
 *
 * connect() {
 *   return listen(this.environment.apiPort);
 * }
 * ```
 *
 * @see https://docs.nestjs.com/techniques/configuration#using-the-configservice
 */
@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  /**
   * Which stage this process is running on, defaulting to the least privileged
   * one so a forgotten variable never claims production.
   *
   * @example
   * ```ts
   * Sentry.init({ environment: this.environment.nodeEnv });
   * ```
   */
  get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true }) ?? ENVIRONMENT_DEFAULTS.NODE_ENV;
  }

  /**
   * The quietest level Nest's logger should still print, defaulting to Nest's
   * own choice.
   *
   * @example
   * ```ts
   * if (environment.logLevel === 'debug') {
   *   dumpTheWholeRequest(request);
   * }
   * ```
   */
  get logLevel(): LogLevel {
    return this.configService.get('LOG_LEVEL', { infer: true }) ?? ENVIRONMENT_DEFAULTS.LOG_LEVEL;
  }

  /**
   * {@link logLevel} and everything louder, in the shape `useLogger` wants.
   *
   * Nest takes the exact set of levels to print, not a threshold: handing it
   * `['warn']` would silence `error` and `fatal` as well. {@link LogLevel} is
   * declared quietest-first for precisely this reason, so the tail of its
   * members from the configured level is the set to enable.
   *
   * @example
   * ```ts
   * app.useLogger(environment.logLevels);   // LOG_LEVEL=warn -> warn, error, fatal
   * ```
   *
   * @see https://docs.nestjs.com/techniques/logger#log-levels
   */
  get logLevels(): LogLevel[] {
    const levels = Object.values(LogLevel);

    return levels.slice(levels.indexOf(this.logLevel));
  }

  /**
   * The container-internal port the api listens on, defaulting to the one the
   * Dockerfile exposes.
   *
   * @example
   * ```ts
   * await app.listen(environment.apiPort);
   * ```
   */
  get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true }) ?? ENVIRONMENT_DEFAULTS.API_PORT;
  }

  /**
   * Where Sentry sends events, or `undefined` when reporting is off.
   *
   * The one getter that deliberately has no fallback: a deployment without an
   * observability backend is a legitimate deployment and the normal case
   * locally, so absence is the answer rather than a gap to paper over.
   *
   * @example
   * ```ts
   * if (environment.sentryDsn === undefined) {
   *   return; // nothing to report to
   * }
   * ```
   */
  get sentryDsn(): string | undefined {
    return this.configService.get('SENTRY_DSN', { infer: true });
  }

  /**
   * Share of transactions Sentry traces, `0` through `1`, defaulting to none.
   *
   * @example
   * ```ts
   * Sentry.init({ tracesSampleRate: environment.sentryTracesSampleRate });
   * ```
   */
  get sentryTracesSampleRate(): number {
    return (
      this.configService.get('SENTRY_TRACES_SAMPLE_RATE', { infer: true }) ??
      ENVIRONMENT_DEFAULTS.SENTRY_TRACES_SAMPLE_RATE
    );
  }

  /**
   * Whether this is the production stage.
   *
   * Phrased as "is it production" rather than "is it not development", so a
   * stage added later is treated as untrusted until someone says otherwise.
   *
   * @example
   * ```ts
   * if (environment.isProduction) {
   *   app.enableShutdownHooks();
   * }
   * ```
   */
  get isProduction(): boolean {
    return this.nodeEnv === NodeEnvironment.Production;
  }

  /**
   * Whether this is the development stage.
   *
   * @example
   * ```ts
   * if (environment.isDevelopment) {
   *   app.enableCors();
   * }
   * ```
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === NodeEnvironment.Development;
  }
}
