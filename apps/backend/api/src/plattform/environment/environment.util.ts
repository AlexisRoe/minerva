import { Logger } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { type ValidationError, validateSync } from 'class-validator';

import { EnvironmentValidationError } from '../../domain/errors/environment.errors';
import { EnvironmentVariables } from './environment.interface';

const logger = new Logger('Environment');

/**
 * Drops the variables that are present but say nothing, so a default can apply.
 *
 * `.env` files are full of `SENTRY_DSN=`, and compose turns an unset
 * `${BE_API_SENTRY_DSN:-}` into the same thing. Left alone, that empty string
 * reaches validation as a value and fails it -- "declared but empty" has to
 * mean "not configured", or a template `.env` could never be committed with a
 * variable left blank.
 *
 * Non-string values are kept untouched: only the environment supplies strings,
 * and a caller passing a real `0` means it.
 *
 * @example
 * ```ts
 * dropBlankValues({ API_PORT: ' 3000 ', SENTRY_DSN: '', NODE_ENV: undefined });
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
 * Drops the npm scope from a package name, leaving what the service is called.
 *
 * `npm_package_name` arrives as `@minerva/api`, because npm needs the scope to
 * keep names unique across the workspace. A `GET /health` body answering
 * `@minerva/api` reads like a dependency rather than a service, and the scope is
 * the workspace -- which anyone reading that response already knows.
 *
 * An unscoped name comes back untouched, and so does a value that is nothing but
 * a scope: returning an empty string there would turn a misconfigured launch
 * into a health response with no name at all.
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
 * Flattens `class-validator`'s error tree into one readable line per broken rule.
 *
 * A {@link ValidationError} is a node, not a message: the messages sit in
 * `constraints`, one per failed decorator, and nested objects hang off
 * `children`. Logging the tree gives a wall of JSON that buries the one line
 * that matters, which is the whole reason this exists.
 *
 * Values are never included. `SENTRY_DSN` is a secret and this output goes to
 * both the console and a `MinervaError` payload bound for Sentry.
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
 * stops the boot.
 *
 * This is the `validate` hook of `ConfigModule.forRoot`, so it runs once while
 * the root module is resolved -- before any controller exists and long before
 * the process listens. The order matters:
 *
 * 1. blanks are dropped, so `SENTRY_DSN=` counts as unset;
 * 2. `plainToInstance` converts, because everything from the environment is a
 *    string and `@IsInt` would reject `'3000'`;
 * 3. `validateSync` checks, and `whitelist` strips the several hundred
 *    unrelated variables `process.env` carries so `ConfigService` only ever
 *    hands out something this class describes.
 *
 * No defaults are applied here. What comes back is what the environment
 * actually said, with anything it did not say left absent -- `EnvironmentService`
 * is where a missing value is turned into a usable one, because whether that is
 * even allowed is a per-variable decision. This function only ever answers "is
 * what I was given legal".
 *
 * On failure every problem is logged on its own line and an
 * {@link EnvironmentValidationError} is thrown. Throwing rather than carrying on
 * is the point: a service that boots on values it could not parse serves stale,
 * plausible-looking answers, and nobody reads the warning.
 *
 * `forbidUnknownValues` is off because the input is a plain environment bag
 * rather than a nested DTO; with it on, `class-validator` rejects the object
 * wholesale instead of reporting which variable is wrong.
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
