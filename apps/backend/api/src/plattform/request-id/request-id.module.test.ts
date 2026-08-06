import { Controller, Get, type INestApplication, Post } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { RequestIdHeader } from '../../constants/request.constants';
import { RequestIdModule } from './request-id.module';

/** The shape `randomUUID` produces, so a minted id can be told from a kept one. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/**
 * The kinds of route the wildcard has to cover: the root path, a nested one, and
 * a method other than `GET`.
 *
 * The root is the one worth spelling out. Express 5 wildcards are named and
 * required, so the obvious `'*splat'` would match every route below *except*
 * `/` -- the case a reader is least likely to try by hand.
 */
@Controller()
class WildcardFixtureController {
  @Get()
  root(): string {
    return 'root';
  }

  @Get('nested/deeply/placed')
  nested(): string {
    return 'nested';
  }

  @Post('written')
  written(): string {
    return 'written';
  }
}

describe('RequestIdModule', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [RequestIdModule],
      controllers: [WildcardFixtureController],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('puts the middleware in front of a controller declared in another module entirely', async () => {
    const response = await request(app.getHttpServer()).get('/').expect(200);

    expect(response.headers[RequestIdHeader.toLowerCase()]).toMatch(UUID_PATTERN);
  });

  it.each([
    ['the root path', 'get', '/'],
    ['a nested path', 'get', '/nested/deeply/placed'],
    ['a route that is not a GET', 'post', '/written'],
  ] as const)('answers %s with an id of its own', async (_label, method, path) => {
    const response = await (method === 'get'
      ? request(app.getHttpServer()).get(path)
      : request(app.getHttpServer()).post(path));

    expect(response.status).toBe(method === 'get' ? 200 : 201);
    expect(response.headers[RequestIdHeader.toLowerCase()]).toMatch(UUID_PATTERN);
  });

  it('gives two requests two different ids', async () => {
    const first = await request(app.getHttpServer()).get('/').expect(200);
    const second = await request(app.getHttpServer()).get('/').expect(200);

    expect(first.headers[RequestIdHeader.toLowerCase()]).not.toBe(second.headers[RequestIdHeader.toLowerCase()]);
  });

  it('leaves a route that was never registered to the 404 handler, id and all', async () => {
    const response = await request(app.getHttpServer()).get('/nothing-here').expect(404);

    /* Middleware runs before routing, so even the answer nobody wrote carries an
       id -- which is exactly the request someone will want to look up. */
    expect(response.headers[RequestIdHeader.toLowerCase()]).toMatch(UUID_PATTERN);
  });
});
