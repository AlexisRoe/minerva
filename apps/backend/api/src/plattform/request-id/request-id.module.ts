import { type MiddlewareConsumer, Module, type NestModule, RequestMethod } from '@nestjs/common';

import { RequestIdMiddleware } from './request-id.middleware';

/**
 * Puts `RequestIdMiddleware` in front of every route in the api.
 *
 * A module rather than an `app.use` in `ServerService`, so that importing this
 * one line into `AppModule` is the whole wiring, and a Nest middleware class
 * stays a Nest middleware class -- resolvable through DI the day it needs a
 * logger or the environment.
 *
 * `configure` applies by *path*, not by module: the routes matched below are
 * every route the application has, wherever they were declared. `{*splat}` is
 * the Express 5 spelling of the wildcard Nest used to write as `'*'` -- the
 * braces make the wildcard segment optional, which is what also matches the
 * root path, and the name is required because path-to-regexp v8 has no
 * anonymous wildcard.
 *
 * @see https://docs.nestjs.com/middleware#applying-middleware
 * @see https://github.com/pillarjs/path-to-regexp#wildcard
 */
@Module({})
export class RequestIdModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes({ path: '{*splat}', method: RequestMethod.ALL });
  }
}
