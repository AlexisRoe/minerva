import { optionalEnv } from '@minerva/typescript-lib';
import * as Sentry from '@sentry/nestjs';

/**
 * Sentry has to be initialised before anything else is imported, so this module
 * is the very first import in `main.ts`. Without a DSN it stays inert, which is
 * the normal case for local development.
 */
const dsn = optionalEnv('SENTRY_DSN', '');

if (dsn !== '') {
  Sentry.init({
    dsn,
    environment: optionalEnv('NODE_ENV', 'development'),
    tracesSampleRate: Number(optionalEnv('SENTRY_TRACES_SAMPLE_RATE', '0')),
  });
}
