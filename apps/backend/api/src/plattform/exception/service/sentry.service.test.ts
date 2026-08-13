import * as Sentry from '@sentry/nestjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_PROFILE_SESSION_SAMPLE_RATE, DEFAULT_TRACES_SAMPLE_RATE } from '../utils/sentry.util';
import { SentryService } from './sentry.service';

const DSN = 'https://key@o1.ingest.sentry.io/2';

/* The real `init` would open a transport and start the profiler binding for the
   rest of the run, which is not something a unit test may leave behind. */
vi.mock('@sentry/nestjs', async (importOriginal) => ({
  ...(await importOriginal<typeof Sentry>()),
  init: vi.fn(),
}));

describe('SentryService.setup', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('starts nothing and says so when no DSN was configured', () => {
    expect(SentryService.setup({})).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts nothing when the configuration is present but invalid', () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(SentryService.setup({ SENTRY_DSN: DSN, NODE_ENV: 'staging' })).toBe(false);
    expect(Sentry.init).not.toHaveBeenCalled();
  });

  it('starts Sentry on a valid configuration', () => {
    expect(SentryService.setup({ SENTRY_DSN: DSN })).toBe(true);
    expect(Sentry.init).toHaveBeenCalledTimes(1);
  });

  it('passes the defaults through to init untouched', () => {
    SentryService.setup({ SENTRY_DSN: DSN });

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: DSN,
        environment: 'development',
        tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
        profileSessionSampleRate: DEFAULT_PROFILE_SESSION_SAMPLE_RATE,
        enableLogs: false,
      }),
    );
  });

  it('passes what the environment configured through to init', () => {
    SentryService.setup({
      SENTRY_DSN: DSN,
      NODE_ENV: 'production',
      SENTRY_TRACES_SAMPLE_RATE: '0.5',
      SENTRY_PROFILE_SESSION_SAMPLE_RATE: '0.25',
      SENTRY_ENABLE_LOGS: 'true',
    });

    expect(Sentry.init).toHaveBeenCalledWith(
      expect.objectContaining({
        environment: 'production',
        tracesSampleRate: 0.5,
        profileSessionSampleRate: 0.25,
        enableLogs: true,
      }),
    );
  });

  it('ties profiling to traced root spans, so the session rate is not a knob wired to nothing', () => {
    SentryService.setup({ SENTRY_DSN: DSN });

    expect(Sentry.init).toHaveBeenCalledWith(expect.objectContaining({ profileLifecycle: 'trace' }));
  });

  it('registers the profiling integration', () => {
    SentryService.setup({ SENTRY_DSN: DSN });

    const [options] = vi.mocked(Sentry.init).mock.calls[0] ?? [];
    const integrations = options?.integrations;

    /* The option also accepts a function that rewrites the default list, which
       is why this is a union rather than an array. */
    expect(Array.isArray(integrations)).toBe(true);
    expect(Array.isArray(integrations) ? integrations.map(({ name }) => name) : []).toContain('ProfilingIntegration');
  });
});
