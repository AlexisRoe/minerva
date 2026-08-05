import * as Sentry from '@sentry/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { configFixture } from '@/fixtures/config.fixture';
import { initSentry } from './init-sentry.util';

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  setTags: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({ name: 'BrowserTracing' })),
}));

const dsn = 'https://key@example.ingest.sentry.io/1';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('initSentry', () => {
  it('stays off without a DSN', () => {
    expect(initSentry(configFixture)).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('stays off for an empty DSN', () => {
    expect(initSentry({ ...configFixture, sentryDsn: '' })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('tags nothing when it does not start', () => {
    initSentry(configFixture);

    expect(Sentry.setTags).not.toHaveBeenCalled();
  });

  it('starts from the runtime configuration', () => {
    const config = {
      ...configFixture,
      mode: 'production',
      sentryDsn: dsn,
      sentryTracesSampleRate: 0.2,
    };

    expect(initSentry(config)).toBe(true);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn,
        environment: 'production',
        release: '@minerva/manager@0.1.0',
        tracesSampleRate: 0.2,
      }),
    );
  });

  it('enables tracing', () => {
    initSentry({ ...configFixture, sentryDsn: dsn });

    expect(Sentry.browserTracingIntegration).toHaveBeenCalled();
    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ integrations: [{ name: 'BrowserTracing' }] }));
  });

  it('tags the session with the build, after starting the SDK', () => {
    initSentry({ ...configFixture, sentryDsn: dsn });

    expect(Sentry.setTags).toHaveBeenCalledWith({
      app: '@minerva/manager',
      version: '0.1.0',
      buildTime: '2026-01-01T00:00:00.000Z',
      mode: 'test',
    });
    // Tags on an uninitialised SDK go nowhere, so the order is the point.
    expect(vi.mocked(Sentry.init).mock.invocationCallOrder[0]).toBeLessThan(
      vi.mocked(Sentry.setTags).mock.invocationCallOrder[0] ?? 0,
    );
  });
});
