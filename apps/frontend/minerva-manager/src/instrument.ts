import * as Sentry from '@sentry/react';

/**
 * Imported first in `main.tsx` so Sentry is watching before React mounts.
 * Without `VITE_SENTRY_DSN` it stays inert, which is the local default.
 */
const dsn = import.meta.env.VITE_SENTRY_DSN;

if (typeof dsn === 'string' && dsn !== '') {
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration()],
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0),
  });
}
