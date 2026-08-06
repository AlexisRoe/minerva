import { MinervaError } from '@minerva/typescript-lib';

/**
 * The api's errors around reading and validating its environment.
 *
 * One subclass per {@link ErrorCode}, and one hard-coded `reference` per class:
 * the reference identifies the *throw site*, so it stays constant for a given
 * class and is generated once with `uuidgen` when the class is written -- never
 * at runtime, or a log line could no longer be traced back to a line of code.
 *
 * Every class registered here is listed in `errors.registry.ts`; add both
 * together, and never reuse or renumber a code -- it is an i18n key and a Sentry
 * fingerprint.
 *
 * @see {@link ../../../../../shared/typescript-lib/src/custom-errors/minerva.error.ts} -- the base class
 */

/**
 * `process.env` does not satisfy `EnvironmentVariables`.
 *
 * Thrown from the `validate` hook of `ConfigModule.forRoot`, which runs while
 * the root module is being resolved -- so the process never reaches `listen`
 * and cannot serve a request against half-configured settings.
 *
 * `class-validator` reports a tree of {@link ValidationError} objects; the
 * payload carries it flattened to one readable line per broken rule, because
 * that is what a person staring at a failed boot needs. Values are deliberately
 * left out: `COOKIE_SECRET` and anything added next to it are secrets, and the
 * payload travels to Sentry.
 */
export class EnvironmentValidationError extends MinervaError {
  constructor(issues: string[], cause?: Error) {
    super({
      reference: '0827a149-579f-4b5d-8106-ddf24b23ae34',
      code: 'ERR_001',
      message: 'Minerva could not start: its environment is not configured correctly.',
      logLevel: 'fatal',
      payload: { issues },
      cause,
    });
  }
}
