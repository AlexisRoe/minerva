import { optionalEnv } from '@minerva/typescript-lib';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

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
    /** @see https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/nodeprofiling/ */
    integrations: [nodeProfilingIntegration()],
    /* `trace` binds a profile to the lifetime of a sampled root span, so the two
       rates multiply: at `SENTRY_TRACES_SAMPLE_RATE=0` nothing is ever profiled,
       whatever the sample rate below says. */
    profileLifecycle: 'trace',
    profileSessionSampleRate: Number(optionalEnv('SENTRY_PROFILE_SESSION_SAMPLE_RATE', '0')),
  });
}
