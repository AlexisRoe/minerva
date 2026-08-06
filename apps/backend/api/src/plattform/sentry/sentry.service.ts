/** biome-ignore-all lint/complexity/noStaticOnlyClass: To keep a consistent class based profile */
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { readSentryEnvironment } from './sentry.util';

export class SentryService {
  /**
   * Starts Sentry from `environment`, or returns having started nothing.
   *
   * Returns whether it initialised, which is what makes the no-op observable to
   * a test. Nothing is thrown on a bad configuration: the api not reporting is
   * survivable, the api not booting is not.
   *
   * `profileLifecycle` is fixed at `trace` rather than configurable. Its default
   * is `manual`, where a profile is only ever taken between explicit
   * `startProfiler`/`stopProfiler` calls -- which nothing here makes, so
   * `profileSessionSampleRate` would be a knob wired to nothing.
   *
   * @example
   * ```ts
   * SentryService.setup(process.env);
   * ```
   *
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#dsn
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#environment
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#integrations
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#tracesSampleRate
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#profileSessionSampleRate
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#profileLifecycle
   * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/configuration/options/#enableLogs
   */
  static setup(environment: NodeJS.ProcessEnv): boolean {
    const configuration = readSentryEnvironment(environment);

    if (configuration === undefined) {
      return false;
    }

    Sentry.init({
      dsn: configuration.dsn,
      environment: configuration.environment,
      integrations: [nodeProfilingIntegration()],
      tracesSampleRate: configuration.tracesSampleRate,
      profileSessionSampleRate: configuration.profileSessionSampleRate,
      profileLifecycle: 'trace',
      enableLogs: configuration.enableLogs,
    });

    return true;
  }
}
