import { SentryService } from './sentry.service';

/**
 * Sentry has to be initialised before anything else is imported, so this module
 * is the very first import in `main.ts` and imports exactly one thing itself.
 *
 * That ordering is why nothing here or below comes from `@minerva/typescript-lib`
 * or from the api's own `EnvironmentService`: importing either would load
 * application code ahead of `Sentry.init`, and whatever loads first is the one
 * thing Sentry cannot instrument. The `SENTRY_*` variables are therefore read,
 * converted and validated in this folder rather than by the environment schema,
 * with only `class-validator` and `class-transformer` borrowed -- neither is a
 * target of the auto-instrumentation.
 *
 * @see https://docs.sentry.io/platforms/javascript/guides/nestjs/
 */
SentryService.setup(process.env);
