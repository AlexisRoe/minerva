import { MinervaError } from '@minerva/typescript-lib';

/**
 * The api's errors around reading and validating its environment.
 *
 * One subclass per {@link ErrorCode}, one hard-coded `uuidgen` `reference` per
 * class -- it names the throw site, so it must not be generated at runtime --
 * and one line in `errors.registry.ts`. A code is never reused or renumbered.
 *
 * @see {@link ../../../../../../../shared/typescript-lib/src/custom-errors/minerva.error.ts} -- the base class
 */

/**
 * `process.env` does not satisfy `EnvironmentVariables`.
 *
 * Thrown from the `validate` hook of `ConfigModule.forRoot`, so the process
 * never reaches `listen` with half-configured settings. The payload carries one
 * line per broken rule, naming variables but never values -- `COOKIE_SECRET` is
 * a secret and the payload travels to Sentry.
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
