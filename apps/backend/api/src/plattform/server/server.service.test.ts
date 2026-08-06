import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Request, Response } from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import type { EnvironmentVariables } from '../environment/interface/environment.interface';
import { EnvironmentService } from '../environment/service/environment.service';
import { SwaggerService } from '../swagger/swagger.service';
import { SERVER_APPLICATION_OPTIONS, ServerService } from './server.service';

/** The secret the signed-cookie tests sign with, long enough to pass the schema. */
const COOKIE_SECRET = 'a-test-secret-of-more-than-32-characters';

/** Routes that report back what the middleware under test did to a request. */
@Controller('probe')
class ProbeController {
  @Get('cookies')
  readCookies(@Req() incoming: Request): Record<string, string> {
    return incoming.cookies;
  }

  @Get('signed-cookies')
  readSignedCookies(@Req() incoming: Request): Record<string, string | false> {
    return incoming.signedCookies;
  }

  @Post('cookies')
  writeCookie(@Res({ passthrough: true }) outgoing: Response, @Body() body: { signed?: boolean }): { set: true } {
    outgoing.cookie('session', 'abc123', { httpOnly: true, sameSite: 'lax', signed: body.signed === true });

    return { set: true };
  }

  @Post('json')
  readJson(@Body() body: { payload?: string }): { length: number } {
    return { length: body.payload?.length ?? 0 };
  }

  @Post('form')
  readForm(@Body() body: Record<string, string>): Record<string, string> {
    return body;
  }
}

/**
 * The `Set-Cookie` a response carries, as one string.
 *
 * Node hands multi-value headers over as an array while supertest's types call
 * every header a string, so both shapes have to be allowed for.
 */
function setCookieOf(headers: { 'set-cookie'?: string | string[] }): string {
  const header = headers['set-cookie'];

  return (Array.isArray(header) ? header[0] : header) ?? '';
}

/**
 * The `name=value` a browser would send back from a `Set-Cookie`, without the
 * attributes -- those are instructions to the browser, not part of the cookie,
 * and feeding them back in would parse `Path` and `SameSite` as cookies of
 * their own.
 */
function cookieSentBack(headers: { 'set-cookie'?: string | string[] }): string {
  return setCookieOf(headers).split(';')[0] ?? '';
}

/** A body whose raw JSON is comfortably `megabytes` in size. */
function payloadOf(megabytes: number): { payload: string } {
  return { payload: 'x'.repeat(megabytes * 1024 * 1024) };
}

/**
 * An `EnvironmentService` over a fixed configuration, rather than one resolved
 * from `EnvironmentModule`.
 *
 * The module calls `ConfigModule.forRoot` in its decorator, which is evaluated
 * once when the file is first imported -- so every test module in a run shares
 * the environment the first one validated, and a test could not vary it. What
 * the environment does to a raw `CORS_ORIGINS=` string is `environment.util`'s
 * subject anyway; here the question is only what `setup` builds out of the
 * values it is handed.
 */
function environmentOf(variables: Partial<EnvironmentVariables>): EnvironmentService {
  return new EnvironmentService(new ConfigService(variables));
}

/** Boots the middleware stack the way `main.ts` does, in the same order. */
async function buildApp(variables: Partial<EnvironmentVariables> = {}): Promise<NestExpressApplication> {
  const moduleFixture = await Test.createTestingModule({ controllers: [ProbeController] }).compile();

  // `logger: false` only mutes the output: the rejected-body tests are meant to
  // produce the exception Nest would log, and the log line is noise here.
  const app = moduleFixture.createNestApplication<NestExpressApplication>({
    ...SERVER_APPLICATION_OPTIONS,
    logger: false,
  });

  const environment = environmentOf(variables);

  // Middleware registered after a route would never see a request for it, so
  // the order these two run in is itself under test.
  ServerService.setup(app, environment);
  SwaggerService.setup(app, environment);

  await app.init();

  return app;
}

describe('ServerService', () => {
  let app: NestExpressApplication;

  beforeEach(async () => {
    app = await buildApp();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('security headers', () => {
    it('sends helmet defaults on every response', async () => {
      const response = await request(app.getHttpServer()).get('/probe/cookies').expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('SAMEORIGIN');
      expect(response.headers['strict-transport-security']).toContain('max-age=');
    });

    it('stops announcing the framework that serves the request', async () => {
      const response = await request(app.getHttpServer()).get('/probe/cookies').expect(200);

      expect(response.headers).not.toHaveProperty('x-powered-by');
    });

    it('keeps the strict script policy on the api itself', async () => {
      const response = await request(app.getHttpServer()).get('/probe/cookies').expect(200);

      // Inline styles are in helmet's own defaults; inline *scripts* are the
      // allowance the documentation page needs and nothing else may have.
      expect(response.headers['content-security-policy']).toContain("script-src 'self';");
      expect(response.headers['content-security-policy']).not.toContain("script-src 'self' 'unsafe-inline'");
    });

    it('relaxes the policy for the documentation page alone, which cannot render without it', async () => {
      const response = await request(app.getHttpServer()).get(`/${SWAGGER_UI_PATH}`).expect(200);

      expect(response.headers['content-security-policy']).toContain("script-src 'self' 'unsafe-inline'");
      expect(response.headers['content-security-policy']).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('still sends the remaining headers on the documentation page', async () => {
      const response = await request(app.getHttpServer()).get(`/${SWAGGER_UI_PATH}`).expect(200);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('cors', () => {
    it('answers any origin, since none are configured yet', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://manager.example.com')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('answers a preflight without reaching the route', async () => {
      const response = await request(app.getHttpServer())
        .options('/probe/json')
        .set('Origin', 'https://manager.example.com')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    it('does not allow credentials, so an allow-list has to come first', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://manager.example.com')
        .expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-credentials');
    });
  });

  describe('cors with an allow-list', () => {
    beforeEach(async () => {
      await app.close();
      app = await buildApp({ CORS_ORIGINS: ['https://localhost:4201', 'https://localhost:4101'] });
    });

    it('answers a listed origin with itself, not with a wildcard', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://localhost:4201')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://localhost:4201');
    });

    it('answers every entry of the list, not only the first', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://localhost:4101')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('https://localhost:4101');
    });

    it('withholds the header from an origin that is not listed', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://elsewhere.example.com')
        .expect(200);

      // The route still answers -- CORS is enforced by the browser, which will
      // refuse to hand this response to the page without the header.
      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });

    it('does not let a port stand in for another', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Origin', 'https://localhost:4301')
        .expect(200);

      expect(response.headers).not.toHaveProperty('access-control-allow-origin');
    });
  });

  describe('cookies', () => {
    it('parses the cookie header into an object the route can read', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Cookie', ['session=abc123', 'locale=de'])
        .expect(200);

      expect(response.body).toEqual({ session: 'abc123', locale: 'de' });
    });

    it('hands out an empty object when the request carries no cookies', async () => {
      const response = await request(app.getHttpServer()).get('/probe/cookies').expect(200);

      expect(response.body).toEqual({});
    });

    it('lets a route set one, attributes and all', async () => {
      const response = await request(app.getHttpServer()).post('/probe/cookies').send({}).expect(201);

      expect(setCookieOf(response.headers)).toContain('session=abc123');
      expect(setCookieOf(response.headers)).toContain('HttpOnly');
      expect(setCookieOf(response.headers)).toContain('SameSite=Lax');
    });

    it('reads back a cookie it set itself, which is the round trip that matters', async () => {
      const issued = await request(app.getHttpServer()).post('/probe/cookies').send({}).expect(201);
      const response = await request(app.getHttpServer())
        .get('/probe/cookies')
        .set('Cookie', cookieSentBack(issued.headers))
        .expect(200);

      expect(response.body).toEqual({ session: 'abc123' });
    });

    it('refuses to sign without a secret rather than issuing an unsigned cookie that looks signed', async () => {
      await request(app.getHttpServer()).post('/probe/cookies').send({ signed: true }).expect(500);
    });
  });

  describe('signed cookies', () => {
    beforeEach(async () => {
      await app.close();
      app = await buildApp({ COOKIE_SECRET });
    });

    it('signs a cookie, so the value is no longer the whole of it', async () => {
      const response = await request(app.getHttpServer()).post('/probe/cookies').send({ signed: true }).expect(201);

      expect(setCookieOf(response.headers)).toContain('session=s%3Aabc123.');
    });

    it('verifies its own signature on the way back in', async () => {
      const issued = await request(app.getHttpServer()).post('/probe/cookies').send({ signed: true }).expect(201);
      const response = await request(app.getHttpServer())
        .get('/probe/signed-cookies')
        .set('Cookie', cookieSentBack(issued.headers))
        .expect(200);

      expect(response.body).toEqual({ session: 'abc123' });
    });

    it('reports a tampered value as false rather than handing it over', async () => {
      const response = await request(app.getHttpServer())
        .get('/probe/signed-cookies')
        .set('Cookie', ['session=s%3Atampered.aW52YWxpZHNpZ25hdHVyZQ'])
        .expect(200);

      expect(response.body).toEqual({ session: false });
    });

    it('still issues unsigned cookies for anything that does not need signing', async () => {
      const response = await request(app.getHttpServer()).post('/probe/cookies').send({}).expect(201);

      expect(setCookieOf(response.headers)).toContain('session=abc123');
    });
  });

  describe('body parsers', () => {
    it('parses a small json body', async () => {
      const response = await request(app.getHttpServer()).post('/probe/json').send({ payload: 'hello' }).expect(201);

      expect(response.body).toEqual({ length: 5 });
    });

    it('accepts a body far past the 100kb express defaults to', async () => {
      const response = await request(app.getHttpServer()).post('/probe/json').send(payloadOf(1)).expect(201);

      expect(response.body.length).toBe(1024 * 1024);
    });

    it('accepts a body just under the limit', async () => {
      const response = await request(app.getHttpServer()).post('/probe/json').send(payloadOf(4)).expect(201);

      expect(response.body.length).toBe(4 * 1024 * 1024);
    });

    it('refuses a body past the limit rather than buffering it', async () => {
      await request(app.getHttpServer()).post('/probe/json').send(payloadOf(6)).expect(413);
    });

    it('parses form encoded bodies at the same limit', async () => {
      const response = await request(app.getHttpServer())
        .post('/probe/form')
        .type('form')
        .send({ subject: 'an invoice' })
        .expect(201);

      expect(response.body).toEqual({ subject: 'an invoice' });
    });

    it('sends the security headers even on the response it rejects', async () => {
      const response = await request(app.getHttpServer()).post('/probe/json').send(payloadOf(6)).expect(413);

      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });
  });

  describe('shutdown hooks', () => {
    it('listens for the signal a container stop sends', () => {
      expect(process.listeners('SIGTERM').length).toBeGreaterThan(0);
    });

    it('stops listening once the application is closed, leaving no listener behind', async () => {
      const listening = process.listeners('SIGTERM').length;

      await app.close();

      expect(process.listeners('SIGTERM').length).toBe(listening - 1);
    });
  });
});
