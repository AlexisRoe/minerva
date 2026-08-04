import type { RuntimeConfig } from '@/platform/config/config.types';

/**
 * A valid {@link RuntimeConfig} for tests and stories.
 *
 * Sentry is off by default, so a test that renders the app tree never reaches
 * the network. Override what a case is actually about:
 *
 * @example
 * ```ts
 * const config = { ...configFixture, sentryDsn: 'https://key@example.ingest.sentry.io/1' };
 * ```
 */
export const configFixture: RuntimeConfig = {
  name: '@minerva/manager',
  version: '0.1.0',
  buildTime: '2026-01-01T00:00:00.000Z',
  mode: 'test',
  sentryDsn: null,
  sentryTracesSampleRate: 0,
};
