import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_JSON_PATH, SWAGGER_SITE_TITLE, SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import { FAVICON_DATA_URI } from '../../constants/favicon.constants';

/**
 * Mounts the Swagger UI and the OpenAPI document onto a running application.
 *
 * The document is built by reflection over the controllers that are already
 * registered, so this has to run after the app is created and before it starts
 * listening — anything registered later will not appear in it.
 *
 * Nothing here is gated by environment: the document describes only what the
 * routes already answer, so exposing it says nothing a caller could not learn by
 * calling them.
 *
 * @example
 * ```ts
 * const app = await NestFactory.create(AppModule);
 * setupSwagger(app);          // GET /docs and GET /docs/json
 * await app.listen(3000);
 * ```
 *
 * @see https://docs.nestjs.com/openapi/introduction
 */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Minerva API')
    .setDescription('The api that turns incoming email into structured, reviewable work items.')
    .setVersion('0.1.0')
    .addTag('health', 'Liveness probes: what this process knows about itself.')
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
    jsonDocumentUrl: SWAGGER_JSON_PATH,
    customSiteTitle: SWAGGER_SITE_TITLE,
    customfavIcon: FAVICON_DATA_URI,
  });
}
