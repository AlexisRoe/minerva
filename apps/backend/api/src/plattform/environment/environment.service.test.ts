import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';
import { ENVIRONMENT_DEFAULTS } from './environment.interface';
import { EnvironmentService } from './environment.service';
import { validateEnvironment } from './environment.util';

/**
 * Boots the real `ConfigModule` against a stubbed `process.env`, rather than a
 * hand-built `ConfigService`. What is worth asserting is that the validated,
 * converted values are the ones that come back out -- and that only holds if
 * the `validate` hook is actually wired in.
 *
 * `ignoreEnvFile` keeps the repository's own `.env` out of it, so the test says
 * the same thing on a machine that has one and on CI, which does not. The
 * remaining options mirror `EnvironmentModule`, which is the point.
 */
async function buildService(environment: Record<string, string>): Promise<EnvironmentService> {
  // Cleared first, because vitest sets NODE_ENV=test on the real process and a
  // test asserting a default must not depend on what the runner happens to say.
  for (const name of ['NODE_ENV', 'LOG_LEVEL', 'API_PORT', 'SENTRY_DSN', 'SENTRY_TRACES_SAMPLE_RATE']) {
    vi.stubEnv(name, undefined);
  }

  for (const [name, value] of Object.entries(environment)) {
    vi.stubEnv(name, value);
  }

  const moduleReference = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ ignoreEnvFile: true, skipProcessEnv: true, validate: validateEnvironment })],
    providers: [EnvironmentService],
  }).compile();

  return moduleReference.get(EnvironmentService);
}

describe('EnvironmentService', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hands out the port as a number, not the string the environment gave', async () => {
    const service = await buildService({ API_PORT: '4401' });

    expect(service.apiPort).toBe(4401);
  });

  it('hands out the sample rate as a number', async () => {
    const service = await buildService({ SENTRY_TRACES_SAMPLE_RATE: '0.5' });

    expect(service.sentryTracesSampleRate).toBe(0.5);
  });

  it('reports the stage it booted with', async () => {
    const service = await buildService({ NODE_ENV: 'production' });

    expect(service.nodeEnv).toBe(NodeEnvironment.Production);
    expect(service.isProduction).toBe(true);
    expect(service.isDevelopment).toBe(false);
  });

  it('reports development as development', async () => {
    const service = await buildService({ NODE_ENV: 'development' });

    expect(service.isDevelopment).toBe(true);
    expect(service.isProduction).toBe(false);
  });

  it('reports the log level', async () => {
    const service = await buildService({ LOG_LEVEL: 'debug' });

    expect(service.logLevel).toBe(LogLevel.Debug);
  });

  it('expands the log level into itself and everything louder', async () => {
    const service = await buildService({ LOG_LEVEL: 'warn' });

    expect(service.logLevels).toEqual([LogLevel.Warn, LogLevel.Error, LogLevel.Fatal]);
  });

  it('enables every level for the loudest-first setting', async () => {
    const service = await buildService({ LOG_LEVEL: 'verbose' });

    expect(service.logLevels).toEqual(Object.values(LogLevel));
  });

  it('hands out the Sentry DSN when one is configured', async () => {
    const service = await buildService({ SENTRY_DSN: 'https://key@o1.ingest.sentry.io/2' });

    expect(service.sentryDsn).toBe('https://key@o1.ingest.sentry.io/2');
  });

  it('reports no DSN when reporting is off', async () => {
    const service = await buildService({ SENTRY_DSN: '' });

    expect(service.sentryDsn).toBeUndefined();
  });

  it('falls back to the defaults for everything the environment leaves out', async () => {
    const service = await buildService({});

    expect(service.nodeEnv).toBe(ENVIRONMENT_DEFAULTS.NODE_ENV);
    expect(service.logLevel).toBe(ENVIRONMENT_DEFAULTS.LOG_LEVEL);
    expect(service.apiPort).toBe(ENVIRONMENT_DEFAULTS.API_PORT);
    expect(service.sentryTracesSampleRate).toBe(ENVIRONMENT_DEFAULTS.SENTRY_TRACES_SAMPLE_RATE);
  });

  it('withholds the default it has no entry for, so absence stays absence', async () => {
    const service = await buildService({});

    expect(service.sentryDsn).toBeUndefined();
    expect(ENVIRONMENT_DEFAULTS).not.toHaveProperty('SENTRY_DSN');
  });

  it('prefers the environment over every default it holds', async () => {
    const service = await buildService({
      NODE_ENV: 'production',
      LOG_LEVEL: 'error',
      API_PORT: '4401',
      SENTRY_TRACES_SAMPLE_RATE: '1',
    });

    expect(service.nodeEnv).toBe(NodeEnvironment.Production);
    expect(service.logLevel).toBe(LogLevel.Error);
    expect(service.apiPort).toBe(4401);
    expect(service.sentryTracesSampleRate).toBe(1);
  });

  it('refuses to build the module when the environment is invalid', async () => {
    // The report this produces is asserted in environment.util.test.ts; here it
    // is only noise, so the logger is muted rather than read.
    vi.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);

    await expect(buildService({ API_PORT: 'not-a-port' })).rejects.toThrow(/environment/i);

    vi.restoreAllMocks();
  });
});
