import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RequestIdHeader } from '../../../constants/request.constants';
import { ApiStatus } from '../../../enum/status.enum';
import { EnvironmentModule } from '../../../plattform/environment/environment.module';
import { EnvironmentService } from '../../../plattform/environment/environment.service';
import { RequestIdModule } from '../../../plattform/request-id/request-id.module';
import { HealthModule } from '../health.module';

/**
 * An identity this workspace does not have, so an assertion below can only pass
 * if the response was built from what the environment reported. Under `pnpm test`
 * the api's real name and version are in the environment, and asserting those
 * would pass just as well against a hard-coded answer.
 */
const SERVICE_NAME = '@minerva/queue-coordinator';
const SERVICE_VERSION = '7.7.7';

/** Every route that has to answer with the plain liveness verdict. */
const VERDICT_ROUTES = ['/health', '/health/live', '/health/ready'] as const;

/** A uuid v4 the api would keep rather than replace. */
const INCOMING_REQUEST_ID = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31';

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('HealthController', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    /* `EnvironmentModule` is imported rather than the service provided directly:
       it is `@Global`, which is what lets the use cases resolve the same
       service. The override then pins the values under test. */
    const moduleFixture = await Test.createTestingModule({
      imports: [EnvironmentModule, RequestIdModule, HealthModule],
    })
      .overrideProvider(EnvironmentService)
      .useValue(
        new EnvironmentService(
          new ConfigService({ npm_package_name: SERVICE_NAME, npm_package_version: SERVICE_VERSION }),
        ),
      )
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it.each(VERDICT_ROUTES)('answers %s with the verdict and who gave it', async (route) => {
    const response = await request(app.getHttpServer()).get(route).expect(200);

    expect(response.body).toEqual({ status: ApiStatus.Ok, name: 'queue-coordinator' });
  });

  it('answers the two probes with exactly what /health answers, so a probe can be moved between them', async () => {
    /* Sequentially: supertest listens on an ephemeral port per request, and
       three of those racing for one server instance reset the connection. */
    const bodies: unknown[] = [];

    for (const route of VERDICT_ROUTES) {
      const response = await request(app.getHttpServer()).get(route).expect(200);

      bodies.push(response.body);
    }

    const [root, live, ready] = bodies;

    expect(live).toEqual(root);
    expect(ready).toEqual(root);
  });

  it('reports the full identity on /health/status', async () => {
    const response = await request(app.getHttpServer()).get('/health/status').expect(200);

    expect(response.body).toEqual({
      status: ApiStatus.Ok,
      name: 'queue-coordinator',
      version: SERVICE_VERSION,
      date: expect.any(String),
      requestId: expect.stringMatching(UUID_PATTERN),
    });
  });

  it('answers /health/status under the id the caller asked for', async () => {
    const response = await request(app.getHttpServer())
      .get('/health/status')
      .set(RequestIdHeader, INCOMING_REQUEST_ID)
      .expect(200);

    expect(response.body.requestId).toBe(INCOMING_REQUEST_ID);
  });

  it('reports the same id in the body of /health/status that it sets in the header', async () => {
    const response = await request(app.getHttpServer()).get('/health/status').expect(200);

    /* The body is the readable half and the header is the one every other route
       carries; a report that quotes one has to be findable by the other. */
    expect(response.headers[RequestIdHeader.toLowerCase()]).toBe(response.body.requestId);
  });

  it.each(VERDICT_ROUTES)('gives %s an id in the header even though its body has no room for one', async (route) => {
    const response = await request(app.getHttpServer()).get(route).expect(200);

    expect(response.headers[RequestIdHeader.toLowerCase()]).toBeDefined();
  });

  it('dates /health/status with a timestamp a client can parse, not with whatever the locale prints', async () => {
    const response = await request(app.getHttpServer()).get('/health/status').expect(200);

    /* Round-tripping catches both halves of the contract: that the string parses
       at all, and that it is the ISO form the OpenAPI document promises. */
    expect(new Date(response.body.date).toISOString()).toBe(response.body.date);
  });

  it('keeps the extra fields off the probe routes, which have no use for them', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).not.toHaveProperty('version');
    expect(response.body).not.toHaveProperty('date');
    expect(response.body).not.toHaveProperty('requestId');
  });

  it('answers /health/ping with plain text', async () => {
    const response = await request(app.getHttpServer()).get('/health/ping').expect(200);

    expect(response.headers['content-type']).toContain('text/plain');
    expect(response.text).toBe('pong');
  });
});
