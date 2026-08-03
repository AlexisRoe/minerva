import type { ConfigEntry } from '../../../vite.runtime-config.js';

/**
 * The stable contract between the environment and `dist/config.json`.
 *
 * Every setting the manager reads at runtime is listed here exactly once: the
 * `APP_FE_MANANGER_*` variable it comes from (root `.env` locally, the
 * pipeline's environment in CI/CD) and the value used when that variable is
 * unset. Adding a setting means adding a line here and a line to `.env.template`.
 *
 * The name, version, build time and mode are added by the plugin itself.
 */
export const configEntries: readonly ConfigEntry[] = [
  { key: 'sentryDsn', env: 'APP_FE_MANANGER_SENTRY_DSN', fallback: null },
  { key: 'sentryTracesSampleRate', env: 'APP_FE_MANANGER_SENTRY_TRACES_SAMPLE_RATE', fallback: 0 },
];
