import { Logger } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LogLevel, NodeEnvironment } from '../../../enum/environment.enum';
import { ENVIRONMENT_DEFAULTS } from '../interface/environment.interface';
import { validateEnvironment } from '../utils/environment.util';
import { EnvironmentService } from './environment.service';

async function buildService(environment: Record<string, string>): Promise<EnvironmentService> {
  const schema = [
    'npm_package_name',
    'npm_package_version',
    'NODE_ENV',
    'LOG_LEVEL',
    'API_PORT',
    'CORS_ORIGINS',
    'COOKIE_SECRET',
    'DATABASE_URL',
    'VALKEY_URL',
    'VALKEY_DB_QUEUE',
    'VALKEY_DB_CACHE',
    'VALKEY_DB_SSE',
    'S3_ENDPOINT',
    'S3_REGION',
    'S3_ACCESS_KEY_ID',
    'S3_SECRET_ACCESS_KEY',
    'S3_BUCKET_ASSETS',
    'S3_BUCKET_ARTIFACTS',
    'S3_PUBLIC_BASE_URL',
    'CAMO_BASE_URL',
    'CAMO_KEY',
    'QUEUE_COORDINATOR_URL',
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
  });

  it('prefers the environment over every default it holds', async () => {
    const service = await buildService({
      NODE_ENV: 'production',
      LOG_LEVEL: 'error',
      API_PORT: '4401',
    });

    expect(service.nodeEnv).toBe(NodeEnvironment.Production);
    expect(service.logLevel).toBe(LogLevel.Error);
    expect(service.apiPort).toBe(4401);
  });

  it('hands out the Postgres and Valkey URLs untouched', async () => {
    const service = await buildService({
      DATABASE_URL: 'postgres://minerva_rw:secret@postgres:5432/minerva',
      VALKEY_URL: 'redis://:secret@valkey:6379',
    });

    expect(service.databaseUrl).toBe('postgres://minerva_rw:secret@postgres:5432/minerva');
    expect(service.valkeyUrl).toBe('redis://:secret@valkey:6379');
  });

  it('reports no database or cache rather than connecting somewhere nobody meant', async () => {
    const service = await buildService({});

    expect(service.databaseUrl).toBeUndefined();
    expect(service.valkeyUrl).toBeUndefined();
    expect(ENVIRONMENT_DEFAULTS).not.toHaveProperty('DATABASE_URL');
    expect(ENVIRONMENT_DEFAULTS).not.toHaveProperty('VALKEY_URL');
  });

  it('reads the Valkey keyspace split as numbers, and defaults it to 0/1/2', async () => {
    const configured = await buildService({ VALKEY_DB_QUEUE: '3', VALKEY_DB_CACHE: '4', VALKEY_DB_SSE: '5' });
    expect(configured.valkeyDatabases).toEqual({ queue: 3, cache: 4, sse: 5 });

    const defaulted = await buildService({});
    expect(defaulted.valkeyDatabases).toEqual({ queue: 0, cache: 1, sse: 2 });
  });

  it('assembles the object storage settings, defaulting the names it chose itself', async () => {
    const service = await buildService({
      S3_ENDPOINT: 'http://garage:3900',
      S3_ACCESS_KEY_ID: 'GK0123456789abcdef01234567',
      S3_SECRET_ACCESS_KEY: 'a'.repeat(64),
      S3_PUBLIC_BASE_URL: 'https://assets.localhost:4501',
    });

    expect(service.objectStorage).toEqual({
      endpoint: 'http://garage:3900',
      region: ENVIRONMENT_DEFAULTS.S3_REGION,
      credentials: { accessKeyId: 'GK0123456789abcdef01234567', secretAccessKey: 'a'.repeat(64) },
      buckets: { assets: ENVIRONMENT_DEFAULTS.S3_BUCKET_ASSETS, artifacts: ENVIRONMENT_DEFAULTS.S3_BUCKET_ARTIFACTS },
      publicBaseUrl: 'https://assets.localhost:4501',
    });
  });

  it('reports no object storage when the credentials are half configured', async () => {
    // An endpoint without a key is not a partially working object store, it is a
    // series of 403s at the first upload.
    const service = await buildService({ S3_ENDPOINT: 'http://garage:3900' });

    expect(service.objectStorage).toBeUndefined();
  });

  it('serves object storage without a public base url, since not every bucket is readable', async () => {
    const service = await buildService({
      S3_ENDPOINT: 'http://garage:3900',
      S3_ACCESS_KEY_ID: 'GK0123456789abcdef01234567',
      S3_SECRET_ACCESS_KEY: 'a'.repeat(64),
    });

    expect(service.objectStorage?.publicBaseUrl).toBeUndefined();
  });

  it('pairs the image proxy origin with its signing key, or reports neither', async () => {
    const key = 'b'.repeat(64);
    const configured = await buildService({ CAMO_BASE_URL: 'https://proxy.localhost:4502', CAMO_KEY: key });
    expect(configured.imageProxy).toEqual({ baseUrl: 'https://proxy.localhost:4502', key });

    // A camo URL without a signature is refused, so an origin on its own is of
    // no use to a caller.
    const halfConfigured = await buildService({ CAMO_BASE_URL: 'https://proxy.localhost:4502' });
    expect(halfConfigured.imageProxy).toBeUndefined();
  });

  it('hands out the queue coordinator url, or undefined where there is none', async () => {
    const configured = await buildService({ QUEUE_COORDINATOR_URL: 'http://queue-coordinator:4301' });
    expect(configured.queueCoordinatorUrl).toBe('http://queue-coordinator:4301');

    const absent = await buildService({});
    expect(absent.queueCoordinatorUrl).toBeUndefined();
  });

  it('refuses to build the module when the environment is invalid', async () => {
    // The report this produces is asserted in environment.util.test.ts; here it
    // is only noise, so the logger is muted rather than read.
    vi.spyOn(Logger.prototype, 'fatal').mockImplementation(() => undefined);

    await expect(buildService({ API_PORT: 'not-a-port' })).rejects.toThrow(/environment/i);

    vi.restoreAllMocks();
  });
});
