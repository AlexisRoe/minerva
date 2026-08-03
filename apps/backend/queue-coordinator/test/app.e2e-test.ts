import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AppModule } from '../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /health', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body).toEqual({ status: 'ok', service: 'queue-coordinator' });
  });

  it('POST /jobs accepts a job from the api', async () => {
    const response = await request(app.getHttpServer())
      .post('/jobs')
      .send({
        id: 'job-1',
        kind: 'parse',
        messageId: 'AAMkAD',
        enqueuedAt: '2026-07-27T12:00:00.000Z',
      })
      .expect(201);

    expect(response.body).toEqual({ accepted: true, depth: 1 });
  });

  it('POST /jobs rejects a malformed payload', async () => {
    await request(app.getHttpServer()).post('/jobs').send({ kind: 'parse' }).expect(400);
  });
});
