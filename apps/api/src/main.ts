import './instrument';

import { existsSync, readFileSync } from 'node:fs';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import { AppModule } from './app/app.module';
import { validateEnv } from './config/env';

function httpsOptions() {
  // Validate eagerly so TLS paths come from the same schema as everything else.
  const env = validateEnv(process.env);
  if (!env.API_TLS) {
    return undefined;
  }
  if (!existsSync(env.TLS_CERT_PATH) || !existsSync(env.TLS_KEY_PATH)) {
    Logger.warn('TLS certificates not found — serving over http. Run ./scripts/setup-certs.sh', 'Bootstrap');
    return undefined;
  }
  return {
    cert: readFileSync(env.TLS_CERT_PATH),
    key: readFileSync(env.TLS_KEY_PATH),
  };
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions: httpsOptions(),
  });

  const config = app.get(ConfigService);
  app.use(helmet());
  app.enableCors({
    origin: (config.get<string>('CORS_ORIGINS') ?? '').split(',').filter(Boolean),
    methods: ['GET', 'POST'],
    credentials: false,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.disable('x-powered-by');
  app.enableShutdownHooks();

  const port = config.get<number>('API_PORT') ?? 3000;
  await app.listen(port);
  Logger.log(`API listening on ${await app.getUrl()}`, 'Bootstrap');
}

bootstrap();
