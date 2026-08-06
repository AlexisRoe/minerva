import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsSemVer,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

import { LogLevel, NodeEnvironment } from '../../../enum/environment.enum';

/**
 * Everything the api reads out of its environment, and the rules each value has
 * to satisfy before the process finishes booting.
 *
 * Property names are the variable names, because this is validated against
 * `process.env` itself -- see `validateEnvironment`. Anything not a string
 * carries a `@Type`, since every value arrives as one. `@IsOptional` decides
 * what a *missing* variable means: optional lets `EnvironmentService` stand in
 * for it, required fails the boot. A malformed variable fails either way.
 *
 * The names are unprefixed; `.env` namespaces per service (`BE_API_PORT`) and
 * `infra/docker/docker-compose.api.yml` maps those onto the names below.
 *
 * The `SENTRY_*` variables are the exception -- `src/plattform/exception` reads
 * them, since Sentry starts long before this class is validated.
 *
 * @see https://docs.nestjs.com/techniques/configuration#custom-validate-function
 */
export class EnvironmentVariables {
  /**
   * What the package this process was started from is called, scope and all.
   *
   * Nobody writes the two `npm_package_*` variables into a `.env`: a package
   * manager exports them from the manifest when it runs a script. `pnpm exec`
   * and a bare `node dist/main.js` do not, which is why both are optional.
   *
   * @see https://docs.npmjs.com/cli/v11/using-npm/scripts#packagejson-vars
   */
  @IsOptional()
  @IsNotEmpty()
  npm_package_name?: string;

  /**
   * The `version` of that same package. `@IsSemVer` because it reaches the
   * OpenAPI document, where a client generator expects something comparable.
   */
  @IsOptional()
  @IsSemVer()
  npm_package_version?: string;

  /** Which stage this process runs on. Reaches Sentry as the environment tag. */
  @IsOptional()
  @IsEnum(NodeEnvironment)
  NODE_ENV?: NodeEnvironment;

  /** The quietest level Nest's logger still prints. */
  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel;

  /**
   * The port the Nest process listens on. Container-internal -- the port
   * published to the host is `BE_API_PORT`, which the api never sees.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  API_PORT?: number;

  /**
   * The browser origins allowed to call the api, comma separated, or empty to
   * allow every one of them -- `https://localhost:4201,https://localhost:4101`
   * locally.
   *
   * Entries are origins, not URLs: the CORS check compares them to the `Origin`
   * header character for character, so a trailing slash never matches. `@IsUrl`
   * alone would wave that through, which is what `@Matches` is for.
   */
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? splitOrigins(value) : value))
  @IsArray()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true }, { each: true })
  @Matches(/^https?:\/\/[^/?#]+$/, { each: true, message: 'CORS_ORIGINS entries must be an origin without a path' })
  CORS_ORIGINS?: readonly string[];

  /**
   * The key cookies are signed with, or absent to issue unsigned ones only.
   *
   * Without it `cookie-parser` cannot verify any, so `{ signed: true }` throws
   * rather than quietly issuing an unsigned cookie. The length floor is not
   * optional -- a guessable secret makes a forged cookie look verified.
   * Generate one with `make secret`.
   */
  @IsOptional()
  @MinLength(32)
  COOKIE_SECRET?: string;
}

/**
 * Reads the comma separated list `CORS_ORIGINS` arrives as into the array the
 * schema declares, dropping blank entries so a trailing comma is harmless.
 *
 * @example
 * ```ts
 * splitOrigins('https://localhost:4201, https://localhost:4101,'); // ['https://localhost:4201', 'https://localhost:4101']
 * ```
 */
function splitOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * The values available to stand in for a variable the environment does not set.
 *
 * Listing a value here does *not* apply it -- `EnvironmentService` decides that
 * per variable, and a credential should have no entry at all so that its absence
 * fails the boot. `satisfies Partial<EnvironmentVariables>` ties each default to
 * the type the schema declares, so a renamed variable breaks this too.
 *
 * @example
 * ```ts
 * get apiPort(): number {
 *   return this.configService.get('API_PORT', { infer: true }) ?? ENVIRONMENT_DEFAULTS.API_PORT;
 * }
 * ```
 */
export const ENVIRONMENT_DEFAULTS = {
  npm_package_name: '@minerva/api',
  npm_package_version: '0.0.0',
  NODE_ENV: NodeEnvironment.Development,
  LOG_LEVEL: LogLevel.Log,
  API_PORT: 3000,
  CORS_ORIGINS: [],
} as const satisfies Partial<EnvironmentVariables>;
