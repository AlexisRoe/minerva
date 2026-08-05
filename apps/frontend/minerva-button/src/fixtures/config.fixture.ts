import { OFFICE_READY_TIMEOUT_MS } from '@/constants/office-js.constants';
import type { AppConfig } from '@/platform/config/config.types';

/**
 * A valid {@link AppConfig} for tests and stories.
 *
 * Sentry is off and the host is unpinned, so a test that renders the app tree
 * never reaches the network. The `host` matches jsdom's own location, which is
 * what lets `loadConfig` tests use this as both the served document and the
 * expected result. Override what a case is actually about:
 *
 * @example
 * ```ts
 * const config = { ...configFixture, demo: true };
 * ```
 */
export const configFixture: AppConfig = {
  name: '@minerva/button',
  version: '0.1.0',
  buildTime: '2026-01-01T00:00:00.000Z',
  mode: 'test',
  sentryDsn: null,
  sentryTracesSampleRate: 0,
  appDomain: null,
  allowDemo: false,
  entraClientId: null,
  officeReadyTimeoutMs: OFFICE_READY_TIMEOUT_MS,
  host: 'localhost',
  retry: 0,
  demo: false,
};
