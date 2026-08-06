/** biome-ignore-all lint/complexity/noStaticOnlyClass: To keep a consistent class based profile */
import type { NestApplicationOptions } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

import { SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import { BODY_SIZE_LIMIT } from '../../constants/request.constants';
import type { EnvironmentService } from '../environment/environment.service';

/**
 * The options the api has to be created with for {@link ServerService.setup} to
 * mean anything.
 *
 * Nest registers its own `json` and `urlencoded` parsers while the application
 * is being created, and Express runs the first parser that matches a request --
 * so a later one with a larger limit never sees a body the default already
 * rejected at `100kb`. Turning the defaults off here is what lets `setup`
 * register the parsers itself, at {@link BODY_SIZE_LIMIT}.
 *
 * Exported so `main.ts` and the tests state the same thing, rather than each
 * remembering to.
 *
 * @example
 * ```ts
 * const app = await NestFactory.create<NestExpressApplication>(AppModule, SERVER_APPLICATION_OPTIONS);
 * ServerService.setup(app);
 * ```
 *
 * @see https://docs.nestjs.com/faq/raw-body
 */
export const SERVER_APPLICATION_OPTIONS = { bodyParser: false } as const satisfies NestApplicationOptions;

/**
 * What the Swagger UI needs on top of helmet's default policy, applied to the
 * documentation route alone.
 *
 * The page ships its configuration as an inline `<script>` and its layout as an
 * inline `<style>`, both of which helmet's default `'self'` blocks, and its
 * favicon is a `data:` URI. Relaxing that globally would hand the same
 * allowance to every future route; scoped here, the api's own responses keep
 * the strict policy and only the page that cannot work under it is exempt.
 *
 * @see https://docs.nestjs.com/security/helmet
 */
const SWAGGER_CONTENT_SECURITY_POLICY = {
  ...helmet.contentSecurityPolicy.getDefaultDirectives(),
  'script-src': ["'self'", "'unsafe-inline'"],
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:'],
};

export class ServerService {
  /**
   * Configures the HTTP layer of a created application: security headers, CORS,
   * cookie parsing, body limits and the shutdown hooks.
   *
   * Runs against an application that exists but is not listening yet, and has
   * to run before anything that registers routes -- `SwaggerService.setup`
   * above all. Express serves one stack in registration order, so a route
   * mounted first would answer without any of the middleware below ever seeing
   * the request.
   *
   * Registration order within this method is deliberate:
   *
   * 1. **helmet** first, so the security headers are on every response
   *    including the ones later middleware fails out of -- a `413` from the
   *    body parser is still a response.
   * 2. **CORS**, which answers preflights and short-circuits them.
   * 3. **cookies**, so a guard or interceptor can read `request.cookies`.
   * 4. **body parsers**, last, because they are the only step that reads the
   *    request stream and the most expensive one to have run for a request that
   *    was going to be rejected anyway.
   *
   * @example
   * ```ts
   * const app = await NestFactory.create<NestExpressApplication>(AppModule, SERVER_APPLICATION_OPTIONS);
   * ServerService.setup(app, app.get(EnvironmentService));
   * SwaggerService.setup(app);
   * await app.listen(3000);
   * ```
   *
   * @see https://docs.nestjs.com/security/helmet
   */
  static setup(app: NestExpressApplication, environment: EnvironmentService): void {
    const { corsOrigins } = environment;

    /** @see https://docs.nestjs.com/security/helmet */
    app.use(helmet());
    app.use(`/${SWAGGER_UI_PATH}`, helmet.contentSecurityPolicy({ directives: SWAGGER_CONTENT_SECURITY_POLICY }));

    /** @see https://docs.nestjs.com/security/cors */
    app.enableCors({ origin: corsOrigins.length > 0 ? [...corsOrigins] : '*' });
    /** @see https://docs.nestjs.com/techniques/cookies */
    app.use(cookieParser(environment.cookieSecret));

    /** @see https://docs.nestjs.com/faq/raw-body */
    app.useBodyParser('json', { limit: BODY_SIZE_LIMIT });
    app.useBodyParser('urlencoded', { limit: BODY_SIZE_LIMIT, extended: true });

    /** @see https://docs.nestjs.com/fundamentals/lifecycle-events */
    app.enableShutdownHooks();
  }
}
