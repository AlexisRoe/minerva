import './instrument';

import { readPort } from '@minerva/typescript-lib';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { SwaggerService } from './plattform/swagger/swagger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  SwaggerService.setup(app);

  await app.listen(readPort('API_PORT', 3000));
}

void bootstrap();
