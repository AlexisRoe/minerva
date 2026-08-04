/**
 * The task pane's runtime configuration adapter.
 *
 * One object holds everything the pane runs on: the deployed document *and*
 * what the URL it was opened with says (`retry`, `demo`, and the host, which is
 * checked against the configured `appDomain`). They are assembled together in
 * {@link loadConfig} because they are needed together, before React mounts --
 * `demo` decides whether Sentry, Office.js and the API adapters start at all,
 * so it cannot arrive from a provider further down the tree. Nothing outside
 * this folder reads `window.location`.
 *
 * The app's settings are not baked into the bundle. They are published as a
 * `config.json` next to it by the `runtimeConfig()` Vite plugin
 * (`vite.runtime-config.ts`, fed by this app's `config.entries.ts`) and fetched
 * on start-up, so the same artefact can be promoted through environments and a
 * new Sentry DSN does not mean a new build.
 *
 * The bootstrap in `main.tsx` calls {@link loadConfig}, hands the result to the
 * Sentry adapter in `src/sentry/`, and mounts {@link ConfigProvider} around the
 * tree; components then read through {@link useConfig}. Nothing outside this
 * folder should fetch the document or reach for `import.meta.env`.
 *
 * @see {@link https://vite.dev/guide/env-and-mode.html} -- modes and the build-time alternative
 * @see {@link https://docs.sentry.io/platforms/javascript/guides/react/} -- the error reporting this configures
 */

export { configFixture } from './config.fixture';
export type { AppConfig, RuntimeConfig } from './config.types';
export { CONFIG_PATH, DEMO_PARAM, isRuntimeConfig, MAX_RETRY, RETRY_PARAM } from './config.types';
export { useConfig } from './hooks/use-config.hook';
export { useOptionalConfig } from './hooks/use-optional-config.hook';
export type { ConfigProviderProps } from './provider/config.provider';
export { ConfigProvider } from './provider/config.provider';
export { loadConfig } from './utils/load-config.util';
