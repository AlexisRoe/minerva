import {
  ConfigDomainMismatchError,
  ConfigInvalidError,
  ConfigParseError,
  ConfigRequestFailedError,
} from '@/domain/errors/config.errors';
import {
  type AppConfig,
  CONFIG_PATH,
  DEMO_PARAM,
  isRuntimeConfig,
  MAX_RETRY,
  RETRY_PARAM,
  type RuntimeConfig,
} from '@/platform/config/config.types';

/**
 * Reduces a configured domain or a whole URL to a bare, comparable host.
 *
 * `appDomain` is written by hand into an environment variable, so it arrives as
 * `example.com`, `https://example.com/` or `EXAMPLE.com:443` depending on who
 * filled the pipeline in. All three mean the same host and all three have to
 * compare equal.
 */
function normaliseHost(value: string): string {
  const withoutScheme = value.trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '');
  const [hostAndPort = ''] = withoutScheme.split('/');
  const [host = ''] = hostAndPort.split(':');

  return host.toLowerCase();
}

/**
 * Parses `retry` into the app's retry budget.
 *
 * Everything that is not a whole number in range collapses to a bound rather
 * than to an error: the parameter comes out of an editable URL, and a pane that
 * refuses to open because someone typed `?retry=abc` is worse than one that
 * treats it as a first attempt.
 */
function readRetry(params: URLSearchParams): number {
  const parsed = Number.parseInt(params.get(RETRY_PARAM) ?? '', 10);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 0;
  }

  return Math.min(parsed, MAX_RETRY);
}

/**
 * Merges the fetched document with what the current URL says.
 *
 * The domain check lives here because this is where both halves meet: the
 * bundle is static and copyable, so the only thing tying it to its deployment
 * is the host it is served from -- and the host it is allowed to be on is a
 * deployed setting. An `appDomain` of `null` -- the fallback, and what every
 * developer machine gets -- switches the check off; pinning a host is a
 * deployment decision, not a code one.
 *
 * @throws {@link ConfigDomainMismatchError} When the host is not `appDomain`.
 */
function applyUrl(config: RuntimeConfig, href: string): AppConfig {
  const url = new URL(href);
  const host = url.hostname.toLowerCase();
  const { appDomain } = config;

  if (appDomain !== null && appDomain.trim() !== '' && normaliseHost(appDomain) !== host) {
    throw new ConfigDomainMismatchError(normaliseHost(appDomain), host);
  }

  return {
    ...config,
    host,
    retry: readRetry(url.searchParams),
    demo: config.allowDemo && url.searchParams.get(DEMO_PARAM) === 'true',
  };
}

/**
 * Fetches and validates the runtime configuration, then completes it from the URL.
 *
 * Called once from the bootstrap before React mounts, so that Sentry is
 * configured before the first line of app code can throw and so that no
 * component ever renders against a half-known configuration. Whether Sentry --
 * or Office.js, or any other outbound adapter -- starts at all depends on
 * `demo`, which is why the query string is read in this same step and not by a
 * second provider further down the tree.
 *
 * It rejects rather than falling back to defaults: a wrong DSN, a missing
 * document or a host the app was never deployed to is a deployment fault, and
 * silently booting anyway hides it.
 *
 * The request is uncached. The document lives at a stable, unhashed path so the
 * same bundle can be promoted between environments, which is exactly the shape
 * an HTTP cache would serve a stale copy of.
 *
 * @param path - Where to read the document from; the deployed path by default.
 * @param href - The URL to read; the document's own by default.
 * @returns The validated configuration, with `host`, `retry` and `demo`.
 * @throws {@link ConfigRequestFailedError} When the response is not OK.
 * @throws {@link ConfigParseError} When the body is not JSON.
 * @throws {@link ConfigInvalidError} When it does not match {@link RuntimeConfig}.
 * @throws {@link ConfigDomainMismatchError} When the host is not the configured one.
 *
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Request/cache} -- the `no-store` mode
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams} -- the query string parser
 *
 * @example
 * ```ts
 * const config = await loadConfig();
 * if (!config.demo) {
 *   await submitReport();
 * }
 * ```
 */
export async function loadConfig(path: string = CONFIG_PATH, href: string = window.location.href): Promise<AppConfig> {
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

  return applyUrl(parsed, href);
}
