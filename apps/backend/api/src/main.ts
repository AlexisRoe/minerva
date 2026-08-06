import './instrument';

import { readPort } from '@minerva/typescript-lib';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupSwagger } from './plattform/swagger/swagger.util';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  setupSwagger(app);

  await app.listen(readPort('API_PORT', 3000));
}

void bootstrap();
