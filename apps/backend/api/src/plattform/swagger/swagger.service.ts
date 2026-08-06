/** biome-ignore-all lint/complexity/noStaticOnlyClass: To keep a consistent class based profile */
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SWAGGER_JSON_PATH, SWAGGER_SITE_TITLE, SWAGGER_UI_PATH } from '../../constants/api-documentation.constants';
import { FAVICON_DATA_URI } from '../../constants/favicon.constants';
import type { EnvironmentService } from '../environment/environment.service';

export class SwaggerService {
  /**
   * Mounts the Swagger UI and the OpenAPI document onto a running application.
   *
   * The document is built by reflection over the controllers that are already
   * registered, so this has to run after the app is created and before it starts
   * listening — anything registered later will not appear in it.
   *
   * Nothing here is gated by environment: the document describes only what the
   * routes already answer, so exposing it says nothing a caller could not learn by
   * calling them. `environment` is taken for the version alone — a document has to
   * say which build it describes, and a literal here would keep advertising a
   * number that no longer matches the routes below it.
   *
   * @example
   * ```ts
   * const app = await NestFactory.create(AppModule);
   * SwaggerService.setup(app, app.get(EnvironmentService));   // GET /docs and GET /docs/json
   * await app.listen(3000);
   * ```
   *
   * @see https://docs.nestjs.com/openapi/introduction
   */
  static setup(app: INestApplication, environment: EnvironmentService): void {
    const config = new DocumentBuilder()
      .setTitle('Minerva API')
      .setDescription('The api that turns incoming email into structured, reviewable work items.')
      .setVersion(environment.serviceVersion)
      .addTag('health', 'Liveness probes: what this process knows about itself.')
      .build();

    const document = SwaggerModule.createDocument(app, config);

    SwaggerModule.setup(SWAGGER_UI_PATH, app, document, {
      jsonDocumentUrl: SWAGGER_JSON_PATH,
      customSiteTitle: SWAGGER_SITE_TITLE,
      customfavIcon: FAVICON_DATA_URI,
    });
  }
}
