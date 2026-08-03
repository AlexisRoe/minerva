import * as Sentry from '@sentry/react';

import type { RuntimeConfig } from '../../config';
import { setBuildTags } from './sentry-tags.util';

/**
 * Starts Sentry from the fetched configuration and tags the session with it.
 *
 * A DSN of `null` -- the fallback in `config.entries.ts`, and what every
 * developer machine gets -- leaves Sentry uninitialised, so `captureError` and
 * `SentryErrorBoundary` stay inert and no events leave the browser. That is the
 * switch: there is no separate "enabled" flag to keep in step.
 *
 * Reading the DSN from the runtime document rather than `import.meta.env` is
 * what lets one built artefact report into different Sentry projects as it is
 * promoted. `mode` becomes the environment and the package version becomes the
 * release, so events land in the right place; {@link setBuildTags} then repeats
 * the app name, version, build time and mode as *searchable* tags, which is what
 * makes "everything from this build" a query rather than a hunt.
 *
 * Called explicitly by the bootstrap rather than run as an import side effect,
 * which is what makes the ordering against the config fetch visible and this
 * function testable.
 *
 * @param config - The configuration loaded at start-up.
 * @returns Whether Sentry was initialised.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/} -- the SDK
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/} -- every `init` option
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/tracing/} -- `browserTracingIntegration` and `tracesSampleRate`
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/configuration/releases/} -- the `release` format
 *
 * @example
 * ```ts
 * initSentry(await loadConfig());
 * ```
 */
export function initSentry(config: RuntimeConfig): boolean {
  if (config.sentryDsn === null || config.sentryDsn === '') {
    return false;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.mode,
    release: `${config.name}@${config.version}`,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: config.sentryTracesSampleRate,
  });

  // After `init`, so the tags are on the scope before the first event.
  setBuildTags(config);

  return true;
}
