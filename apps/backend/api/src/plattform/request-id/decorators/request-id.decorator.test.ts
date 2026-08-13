import { Controller, Get, type INestApplication, Req } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { Request } from 'express';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, describe, expect, it } from 'vitest';
import { REQUEST_ID_HEADER } from '../../../constants/request.constants';
import type { RequestWithRequestId } from '../interface/request-id.interface';
import { RequestIdModule } from '../request-id.module';
import { RequestId } from './request-id.decorator';

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** A uuid v4 no other test uses, so a kept id can only have come from the header. */
const INCOMING_REQUEST_ID = '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31';

/**
 * A controller that exists only to be handed a request id.
 *
 * A param decorator is only itself once Nest resolves it for a real route --
 * calling the factory by hand would test a function, not the wiring that makes
 * it reach a handler. Echoing the value back is what lets the assertions compare
 * it against the response header and against the request it was attached to.
 */
@Controller('fixture')
class RequestIdFixtureController {
  @Get()
  read(@RequestId() requestId: string): { requestId: string } {
    return { requestId };
  }

  @Get('attached')
  attached(@RequestId() requestId: string, @Req() httpRequest: Request): { requestId: string; attached?: string } {
    return { requestId, attached: (httpRequest as RequestWithRequestId).requestId };
  }
}

/** Builds an app whose fixture routes are, or are not, behind the middleware. */
async function buildApp(withMiddleware: boolean): Promise<INestApplication<App>> {
  const moduleFixture = await Test.createTestingModule({
    imports: withMiddleware ? [RequestIdModule] : [],
    controllers: [RequestIdFixtureController],
  }).compile();

  const app = moduleFixture.createNestApplication();
  await app.init();

  return app;
}

describe('RequestId', () => {
  let app: INestApplication<App>;

  afterEach(async () => {
    await app.close();
  });

  it('hands the handler the id the caller asked to be answered under', async () => {
    app = await buildApp(true);

    const response = await request(app.getHttpServer())
      .get('/fixture')
      .set(REQUEST_ID_HEADER, INCOMING_REQUEST_ID)
      .expect(200);

    expect(response.body).toEqual({ requestId: INCOMING_REQUEST_ID });
  });

  it('hands over the minted id when the caller sent none, so a handler never sees an absence', async () => {
    app = await buildApp(true);

    const response = await request(app.getHttpServer()).get('/fixture').expect(200);

    expect(response.body.requestId).toMatch(UUID_PATTERN);
  });

  it('reads the same id the response reports, which is what makes the echoed header quotable', async () => {
    app = await buildApp(true);

    const response = await request(app.getHttpServer()).get('/fixture').expect(200);

    expect(response.headers[REQUEST_ID_HEADER.toLowerCase()]).toBe(response.body.requestId);
  });

  it('answers the same id twice within one request', async () => {
    app = await buildApp(true);

    const response = await request(app.getHttpServer()).get('/fixture/attached').expect(200);

    expect(response.body.attached).toBe(response.body.requestId);
  });

  describe('without the middleware in front of it', () => {
    it('still keeps a usable id from the header, rather than depending on the middleware for the rule', async () => {
      app = await buildApp(false);

      const response = await request(app.getHttpServer())
        .get('/fixture')
        .set(REQUEST_ID_HEADER, INCOMING_REQUEST_ID)
        .expect(200);

      expect(response.body).toEqual({ requestId: INCOMING_REQUEST_ID });
    });

    it('mints one rather than failing the request', async () => {
      app = await buildApp(false);

      const response = await request(app.getHttpServer()).get('/fixture').expect(200);

      expect(response.body.requestId).toMatch(UUID_PATTERN);
    });

    it('attaches what it minted, so a second reader of the same request agrees with the first', async () => {
      app = await buildApp(false);

      const response = await request(app.getHttpServer()).get('/fixture/attached').expect(200);

      expect(response.body.attached).toBe(response.body.requestId);
    });
  });
});
