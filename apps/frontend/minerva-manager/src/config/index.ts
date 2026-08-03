/**
 * The manager's runtime configuration adapter.
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
export type { RuntimeConfig } from './config.types';
export { CONFIG_PATH, isRuntimeConfig } from './config.types';
export { useConfig } from './hooks/use-config.hook';
export type { ConfigProviderProps } from './provider/config.provider';
export { ConfigProvider } from './provider/config.provider';
export { loadConfig } from './utils/load-config.util';
