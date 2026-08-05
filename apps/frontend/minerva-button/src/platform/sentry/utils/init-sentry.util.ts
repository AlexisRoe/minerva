import * as Sentry from '@sentry/react';

import type { AppConfig } from '@/platform/config/config.types';
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
 * A demo session is the second switch. The pane is then driven by fixtures --
 * shown inside the manager, in a story, in a sales walkthrough -- so its errors
 * are not production signal, and letting them into the project would mean
 * alerting on a mock. Demo mode makes no outbound calls, and Sentry is one.
 *
 * No `browserTracingIntegration`, and so no `tracesSampleRate`: it pulls
 * `@sentry/browser-utils` and the performance instrumentation into the first
 * chunk the pane loads, and the pane wants error reporting, not spans. The
 * default integrations -- global handlers, breadcrumbs -- are left alone, which
 * is what actually catches the errors.
 *
 * @param config - The configuration loaded at start-up.
 * @returns Whether Sentry was initialised.
 *
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/} -- the SDK
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/configuration/options/} -- every `init` option
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/tracing/} -- the tracing this deliberately leaves off
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/configuration/releases/} -- the `release` format
 *
 * @example
 * ```ts
 * initSentry(await loadConfig());
 * ```
 */
export function initSentry(config: AppConfig): boolean {
  if (config.demo) {
    return false;
  }

  if (config.sentryDsn === null || config.sentryDsn === '') {
    return false;
  }

  Sentry.init({
    dsn: config.sentryDsn,
    environment: config.mode,
    release: `${config.name}@${config.version}`,
  });

  setBuildTags(config);

  return true;
}
