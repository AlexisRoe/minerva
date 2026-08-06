import './plattform/sentry/instrument';

import { MinervaError } from '@minerva/typescript-lib';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';
import { EnvironmentService } from './plattform/environment/environment.service';
import { SERVER_APPLICATION_OPTIONS, ServerService } from './plattform/server/server.service';
import { SwaggerService } from './plattform/swagger/swagger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, SERVER_APPLICATION_OPTIONS);
  const environment = app.get(EnvironmentService);

  app.useLogger(environment.logLevels);

  ServerService.setup(app, environment);
  SwaggerService.setup(app, environment);

  await app.listen(environment.apiPort);
}

/* A `MinervaError` escaping the bootstrap is a configuration fault that has
   already been reported line by line -- the environment validation in
   `EnvironmentModule` above all. Re-throwing it would bury that report under an
   unhandled-rejection stack, so the exit code carries it from here instead. */
void bootstrap().catch((error: unknown) => {
  if (MinervaError.is(error)) {
    process.exitCode = 1;
    return;
  }

  throw error;
});
