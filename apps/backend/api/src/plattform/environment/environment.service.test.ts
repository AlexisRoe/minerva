import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';
import { ENVIRONMENT_DEFAULTS } from './environment.interface';
import { EnvironmentService } from './environment.service';
import { validateEnvironment } from './environment.util';

async function buildService(environment: Record<string, string>): Promise<EnvironmentService> {
  const schema = [
    'npm_package_name',
    'npm_package_version',
    'NODE_ENV',
    'LOG_LEVEL',
    'API_PORT',
    'SENTRY_DSN',
    'SENTRY_TRACES_SAMPLE_RATE',
    'CORS_ORIGINS',
    'COOKIE_SECRET',
  ];

  for (const name of schema) {
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

  it('reports the service name unscoped, as the health body needs it', async () => {
    const service = await buildService({ npm_package_name: '@minerva/queue-coordinator' });

    expect(service.serviceName).toBe('queue-coordinator');
  });

  it('reports the version the launching package manager announced', async () => {
    const service = await buildService({ npm_package_version: '2.4.1' });

    expect(service.serviceVersion).toBe('2.4.1');
  });

  it('falls back to a version nothing ships under, when nothing announced one', async () => {
    const service = await buildService({});

    expect(service.serviceVersion).toBe(ENVIRONMENT_DEFAULTS.npm_package_version);
    expect(service.serviceName).toBe('api');
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

  it('hands out the allowed origins as a list, not as the string it was configured as', async () => {
    const service = await buildService({ CORS_ORIGINS: 'https://localhost:4201,https://localhost:4101' });

    expect(service.corsOrigins).toEqual(['https://localhost:4201', 'https://localhost:4101']);
  });

  it('reports no allowed origins when none are configured, which means every origin', async () => {
    const service = await buildService({});

    expect(service.corsOrigins).toEqual([]);
  });

  it('reports no allowed origins for an empty variable, so an unset and a blank list agree', async () => {
    const service = await buildService({ CORS_ORIGINS: '' });

    expect(service.corsOrigins).toEqual([]);
  });

  it('hands out the cookie secret when one is configured', async () => {
    const secret = 'a-test-secret-of-more-than-32-characters';
    const service = await buildService({ COOKIE_SECRET: secret });

    expect(service.cookieSecret).toBe(secret);
  });

  it('reports no cookie secret when nothing is signed, rather than inventing one', async () => {
    const service = await buildService({});

    expect(service.cookieSecret).toBeUndefined();
    expect(ENVIRONMENT_DEFAULTS).not.toHaveProperty('COOKIE_SECRET');
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
