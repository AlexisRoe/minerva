import './instrument';

import { readPort } from '@minerva/typescript-lib';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(readPort('API_PORT', 3000));
}

void bootstrap();
