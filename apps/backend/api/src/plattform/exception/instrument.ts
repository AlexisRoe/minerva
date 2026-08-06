import { SentryService } from './service/sentry.service';

/**
 * Starts Sentry. The very first import in `main.ts`, because whatever loads
 * before `Sentry.init` is the one thing Sentry cannot instrument.
 *
 * Nothing reachable from here may touch application code, which is why the
 * `SENTRY_*` variables are read by `sentry.util.ts` instead of the environment
 * schema, and why this folder keeps `sentry.*` and `exception.*` apart: only the
 * latter runs inside a request and is free to import the rest of the api.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/
 */
SentryService.setup(process.env);
