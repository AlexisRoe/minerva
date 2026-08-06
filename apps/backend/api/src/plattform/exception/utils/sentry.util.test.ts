import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_PROFILE_SESSION_SAMPLE_RATE,
  DEFAULT_TRACES_SAMPLE_RATE,
  readSentryEnvironment,
  toBoolean,
  toNumber,
} from './sentry.util';

const DSN = 'https://key@o1.ingest.sentry.io/2';

/** Mutes the report `readSentryEnvironment` writes, and hands it over to be read. */
function captureWarnings() {
  return vi.spyOn(console, 'warn').mockImplementation(() => undefined);
}

describe('toNumber', () => {
  it('reads a number the environment supplied as a string', () => {
    expect(toNumber('0.25', 0.1)).toBe(0.25);
  });

  it('falls back for an unset or blank value', () => {
    expect(toNumber(undefined, 0.1)).toBe(0.1);
    expect(toNumber('   ', 0.1)).toBe(0.1);
  });

  it('answers NaN for something unreadable, rather than hiding it behind the fallback', () => {
    expect(toNumber('full', 0.1)).toBeNaN();
  });
});

describe('toBoolean', () => {
  it('reads both words, whatever they were capitalised as', () => {
    expect(toBoolean('true', false)).toBe(true);
    expect(toBoolean('FALSE', true)).toBe(false);
  });

  it('falls back for an unset or blank value', () => {
    expect(toBoolean(undefined, false)).toBe(false);
    expect(toBoolean('  ', true)).toBe(true);
  });

  it('hands anything else back as a string, because Boolean() would read it as true', () => {
    expect(toBoolean('yes', false)).toBe('yes');
  });
});

describe('readSentryEnvironment', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('stays quiet and reports nothing when no DSN was configured', () => {
    const warn = captureWarnings();

    expect(readSentryEnvironment({})).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('reads a DSN declared but left blank as unset, so a template .env can ship', () => {
    const warn = captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: '   ' })).toBeUndefined();
    expect(warn).not.toHaveBeenCalled();
  });

  it('defaults to production-shaped sampling and logs off', () => {
    const environment = readSentryEnvironment({ SENTRY_DSN: DSN });

    expect(environment).toMatchObject({
      dsn: DSN,
      environment: 'development',
      tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
      profileSessionSampleRate: DEFAULT_PROFILE_SESSION_SAMPLE_RATE,
      enableLogs: false,
    });
  });

  it('prefers what the environment said over every default', () => {
    const environment = readSentryEnvironment({
      SENTRY_DSN: DSN,
      NODE_ENV: 'production',
      SENTRY_TRACES_SAMPLE_RATE: '0.5',
      SENTRY_PROFILE_SESSION_SAMPLE_RATE: '0.25',
      SENTRY_ENABLE_LOGS: 'true',
    });

    expect(environment).toMatchObject({
      environment: 'production',
      tracesSampleRate: 0.5,
      profileSessionSampleRate: 0.25,
      enableLogs: true,
    });
  });

  it('accepts a self-hosted relay on an internal hostname', () => {
    const environment = readSentryEnvironment({ SENTRY_DSN: 'https://key@relay/2' });

    expect(environment?.dsn).toBe('https://key@relay/2');
  });

  it('disables reporting rather than the api when the DSN is not a URL', () => {
    const warn = captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: 'not-a-dsn' })).toBeUndefined();
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('dsn'));
  });

  it('rejects a sample rate above 1', () => {
    captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: DSN, SENTRY_TRACES_SAMPLE_RATE: '2' })).toBeUndefined();
  });

  it('rejects a sample rate that is not a number, instead of falling back to the default', () => {
    captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: DSN, SENTRY_TRACES_SAMPLE_RATE: 'full' })).toBeUndefined();
  });

  it('rejects a profile session rate above 1', () => {
    captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: DSN, SENTRY_PROFILE_SESSION_SAMPLE_RATE: '1.5' })).toBeUndefined();
  });

  it('rejects a stage it does not know, so the environment tag stays meaningful', () => {
    captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: DSN, NODE_ENV: 'staging' })).toBeUndefined();
  });

  it('rejects a truthy-looking word that is not a boolean', () => {
    captureWarnings();

    expect(readSentryEnvironment({ SENTRY_DSN: DSN, SENTRY_ENABLE_LOGS: 'yes' })).toBeUndefined();
  });

  it('names every broken variable, not just the first one', () => {
    const warn = captureWarnings();

    readSentryEnvironment({ SENTRY_DSN: DSN, NODE_ENV: 'staging', SENTRY_ENABLE_LOGS: 'yes' });

    const reported = warn.mock.calls.map(([message]) => String(message)).join('\n');

    expect(reported).toContain('environment');
    expect(reported).toContain('enableLogs');
  });

  it('never prints a value, because the DSN is a secret', () => {
    const warn = captureWarnings();

    readSentryEnvironment({ SENTRY_DSN: DSN, NODE_ENV: 'staging' });

    for (const [message] of warn.mock.calls) {
      expect(String(message)).not.toContain(DSN);
    }
  });
});
