/** biome-ignore-all lint/complexity/noStaticOnlyClass: To keep a consistent class based profile */
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

import { readSentryEnvironment } from '../utils/sentry.util';

export class SentryService {
  /**
   * Starts Sentry from `environment`, and answers whether it did.
   *
   * A bad configuration is never thrown on: the api not reporting is survivable,
   * the api not booting is not. `profileLifecycle` is fixed at `trace` because
   * the default `manual` profiles only between explicit `startProfiler` calls,
   * which nothing here makes.
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
