import { ConfigInvalidError, ConfigParseError, ConfigRequestFailedError } from '@/domain/errors/config.errors';
import { CONFIG_PATH, isRuntimeConfig, type RuntimeConfig } from '@/platform/config/config.types';

/**
 * Fetches and validates the runtime configuration.
 *
 * Called once from the bootstrap before React mounts, so that Sentry is
 * configured before the first line of app code can throw and so that no
 * component ever renders against a half-known configuration. It rejects rather
 * than falling back to defaults: a wrong DSN or a missing document is a
 * deployment fault, and silently booting without error reporting hides it.
 *
 * The request is uncached. The document lives at a stable, unhashed path so the
 * same bundle can be promoted between environments, which is exactly the shape
 * an HTTP cache would serve a stale copy of. The same reasoning keeps it out of
 * the PWA precache: the workbox `globPatterns` in `vite.config.ts` deliberately
 * do not cover `.json`, so an installed manager still reads its settings from
 * the network.
 *
 * @param path - Where to read the document from; the deployed path by default.
 * @returns The validated configuration.
 * @throws {@link ConfigRequestFailedError} When the response is not OK.
 * @throws {@link ConfigParseError} When the body is not JSON.
 * @throws {@link ConfigInvalidError} When it does not match {@link RuntimeConfig}.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request/cache} -- the `no-store` mode
 * @see {@link https://vite.dev/guide/env-and-mode.html} -- the build-time alternative this replaces
 *
 * @example
 * ```ts
 * const config = await loadConfig();
 * ```
 */
export async function loadConfig(path: string = CONFIG_PATH): Promise<RuntimeConfig> {
  const response = await fetch(path, { cache: 'no-store' });

  if (!response.ok) {
    throw new ConfigRequestFailedError(path, response.status, response.statusText);
  }

  let parsed: unknown;
  try {
    parsed = await response.json();
  } catch (cause) {
    throw new ConfigParseError(path, cause instanceof Error ? cause : undefined);
  }

  if (!isRuntimeConfig(parsed)) {
    throw new ConfigInvalidError(path);
  }

  return parsed;
}
