// Sentry must be initialized before any other import runs (see @sentry/nestjs docs).
import 'dotenv/config';
import * as Sentry from '@sentry/nestjs';

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    sendDefaultPii: false,
  });
}
