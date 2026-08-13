import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type ValidationError, validateSync } from 'class-validator';

import { EnvironmentValidationError } from '../../exception/errors/environment.errors';
import { EnvironmentVariables } from '../interface/environment.interface';

const logger = new Logger('Environment');

/**
 * Drops the variables that are present but say nothing, so a default can apply.
 *
 * `.env` files are full of `COOKIE_SECRET=`, and compose turns an unset
 * `${BE_API_COOKIE_SECRET:-}` into the same thing -- "declared but empty" has to
 * mean "not configured". Non-string values are kept untouched.
 *
 * @example
 * ```ts
 * dropBlankValues({ API_PORT: ' 3000 ', COOKIE_SECRET: '', NODE_ENV: undefined });
 * // { API_PORT: '3000' }
 * ```
 */
export function dropBlankValues(config: Record<string, unknown>): Record<string, unknown> {
  const entries = Object.entries(config).flatMap<[string, unknown]>(([key, value]) => {
    if (value === undefined || value === null) {
      return [];
    }

    if (typeof value !== 'string') {
      return [[key, value]];
    }

    const trimmed = value.trim();
    return trimmed === '' ? [] : [[key, trimmed]];
  });

  return Object.fromEntries(entries);
}

/**
 * Drops the npm scope from a package name, leaving what the service is called,
 * so a `GET /health` body says `api` rather than `@minerva/api`.
 *
 * An unscoped name comes back untouched, and so does one that is nothing but a
 * scope -- an empty name would be worse than a wrong one.
 *
 * @example
 * ```ts
 * toServiceName('@minerva/api'); // 'api'
 * toServiceName('api');          // 'api'
 * ```
 *
 * @see https://docs.npmjs.com/cli/v11/using-npm/scope
 */
export function toServiceName(packageName: string): string {
  if (!packageName.startsWith('@')) {
    return packageName;
  }

  const unscoped = packageName.split('/').at(1);

  return unscoped === undefined || unscoped === '' ? packageName : unscoped;
}

/**
 * Flattens `class-validator`'s error tree into one readable line per broken rule
 * -- the messages sit in `constraints`, and nested objects hang off `children`.
 *
 * Values are never included: `COOKIE_SECRET` is a secret, and this reaches both
 * the console and a `MinervaError` payload bound for Sentry.
 *
 * @example
 * ```ts
 * flattenValidationErrors(validateSync(candidate));
 * // ['API_PORT: must be an integer number', 'API_PORT: must not be less than 1']
 * ```
 *
 * @see https://github.com/typestack/class-validator#validation-errors
 */
export function flattenValidationErrors(errors: readonly ValidationError[], parentPath = ''): string[] {
  return errors.flatMap((error) => {
    const path = parentPath === '' ? error.property : `${parentPath}.${error.property}`;
    const own = Object.values(error.constraints ?? {}).map((message) => `${path}: ${message}`);

    return [...own, ...flattenValidationErrors(error.children ?? [], path)];
  });
}

/**
 * Turns a raw environment into a validated {@link EnvironmentVariables}, or
 * throws {@link EnvironmentValidationError} and stops the boot.
 *
 * The `validate` hook of `ConfigModule.forRoot`, run once while the root module
 * resolves. The order matters: blanks are dropped, `plainToInstance` converts
 * (everything from the environment is a string), then `validateSync` checks --
 * with `whitelist` stripping the hundreds of unrelated variables `process.env`
 * carries.
 *
 * No defaults are applied; this only answers whether what it was given is legal,
 * and `EnvironmentService` decides what a missing value means.
 *
 * `forbidUnknownValues` is off because the input is a plain environment bag: with
 * it on, `class-validator` rejects the object wholesale rather than naming the
 * variable that is wrong.
 *
 * @example
 * ```ts
 * ConfigModule.forRoot({ isGlobal: true, validate: validateEnvironment });
 * ```
 *
 * @see https://docs.nestjs.com/techniques/configuration#custom-validate-function
 */
export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const candidate = plainToInstance(EnvironmentVariables, dropBlankValues(config));

  const errors = validateSync(candidate, {
    skipMissingProperties: false,
    whitelist: true,
    forbidUnknownValues: false,
  });

  if (errors.length === 0) {
    return candidate;
  }

  const issues = flattenValidationErrors(errors);

  logger.fatal(`The environment is not valid -- ${issues.length} problem(s) found:`);

  for (const issue of issues) {
    logger.fatal(issue);
  }

  throw new EnvironmentValidationError(issues);
}
