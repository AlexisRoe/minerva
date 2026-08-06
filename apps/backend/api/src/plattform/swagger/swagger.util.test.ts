import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SWAGGER_JSON_PATH, SWAGGER_SITE_TITLE, SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import { FAVICON_DATA_URI } from '../../constants/favicon.constants';
import { HealthModule } from '../../health/health.module';
import { setupSwagger } from './swagger.util';

describe('setupSwagger', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({ imports: [HealthModule] }).compile();

    app = moduleFixture.createNestApplication();
    setupSwagger(app);
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
    /* The custom link replaces Swagger's own two, rather than joining them. */
    expect(response.text).not.toContain('favicon-32x32.png');
  });

  it('describes every registered route in the OpenAPI document', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    expect(response.body.info).toMatchObject({ title: 'Minerva API', version: '0.1.0' });
    expect(Object.keys(response.body.paths)).toEqual(['/health', '/health/ping']);
  });

  it('resolves the response schema of a documented route', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    /* The `type: RootResponse` on the controller only carries a schema because
       the DTO's properties are decorated too — an undecorated DTO documents the
       route as returning an empty object. */
    expect(response.body.paths['/health'].get.responses['200'].content['application/json'].schema).toEqual({
      $ref: '#/components/schemas/RootResponse',
    });
    expect(response.body.components.schemas.RootResponse.properties.name).toMatchObject({ type: 'string' });
    expect(response.body.components.schemas.ApiStatus.enum).toEqual(['ok', 'error', 'pending']);
  });

  it('documents the ping route as plain text', async () => {
    const response = await request(app.getHttpServer()).get(`/${SWAGGER_JSON_PATH}`).expect(200);

    expect(response.body.paths['/health/ping'].get.responses['200'].content).toHaveProperty('text/plain');
  });
});
