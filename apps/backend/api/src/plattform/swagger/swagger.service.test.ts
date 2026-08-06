import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SWAGGER_JSON_PATH, SWAGGER_SITE_TITLE, SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import { FAVICON_DATA_URI } from '../../constants/favicon.constants';
import { HealthModule } from '../../health/health.module';
import { EnvironmentModule } from '../environment/environment.module';
import { EnvironmentService } from '../environment/environment.service';
import { SwaggerService } from './swagger.service';

/**
 * A version this package has never had, so the assertion below can only pass if
 * the document was built from what the service reported. A fixture rather than
 * the real environment for the same reason: under `pnpm test` the manifest's own
 * version is exported, and asserting that would also pass against a literal.
 */
const SERVICE_VERSION = '7.7.7';

describe('setup Swagger', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    /* `EnvironmentModule` is imported rather than the service provided directly:
       it is `@Global`, which is what lets `HealthModule`'s use case resolve the
       same service. The override then pins the one value under test. */
    const moduleFixture = await Test.createTestingModule({ imports: [EnvironmentModule, HealthModule] })
      .overrideProvider(EnvironmentService)
      .useValue(new EnvironmentService(new ConfigService({ npm_package_version: SERVICE_VERSION })))
      .compile();

    app = moduleFixture.createNestApplication();
    SwaggerService.setup(app, app.get(EnvironmentService));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('serves the UI', async () => {
    await request(app.getHttpServer()).get(`/${SWAGGER_UI_PATH}`).expect(200);
  });

  it('brands the page with the Minerva title and favicon', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_UI_PATH}`).expect(200);

    expect(response.text).toContain(`<title>${SWAGGER_SITE_TITLE}</title>`);
    expect(response.text).toContain(`<link rel='icon' href='${FAVICON_DATA_URI}' />`);
    expect(response.text).not.toContain('favicon-32x32.png');
  });

  it('describes every registered route in the OpenAPI document', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    expect(response.body.info).toMatchObject({ title: 'Minerva API', version: SERVICE_VERSION });
    expect(Object.keys(response.body.paths).sort()).toEqual([
      '/health',
      '/health/live',
      '/health/ping',
      '/health/ready',
      '/health/status',
    ]);
  });

  it('resolves the response schema of a documented route', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    expect(response.body.paths['/health'].get.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/HealthResponse',
    });
    expect(response.body.components.schemas.HealthResponse.properties.name).toMatchObject({ type: 'string' });
    expect(response.body.components.schemas.ApiStatus.enum).toEqual(['ok', 'error', 'pending']);
  });

  it('carries the inherited properties into the schema of the route that extends one', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    /* `StatusResponse extends HealthResponse`, and a generated client is only
       usable if that shows up as properties rather than as a lost base class. */
    expect(Object.keys(response.body.components.schemas.StatusResponse.properties).sort()).toEqual([
      'date',
      'name',
      'requestId',
      'status',
      'version',
    ]);
    expect(response.body.components.schemas.StatusResponse.properties.date).toMatchObject({ format: 'date-time' });
  });

  it('documents the ping route as plain text', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    expect(response.body.paths['/health/ping'].get.responses['200'].content).toHaveProperty('text/plain');
  });
});
