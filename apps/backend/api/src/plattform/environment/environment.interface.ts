import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsSemVer,
  IsUrl,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';

import { LogLevel, NodeEnvironment } from '../../enum/environment.enum';

/**
 * Everything the api reads out of its environment, and the rules each value has
 * to satisfy before the process is allowed to finish booting.
 *
 * Property names are the variable names, because this class is validated
 * against `process.env` itself -- see `validateEnvironment`. Every value
 * arriving there is a string (or `undefined`), so anything that is not a string
 * carries a `@Type` telling `class-transformer` what to convert it to first;
 * validating before converting would reject `API_PORT=3000` for not being a
 * number.
 *
 * `@IsOptional` is the switch that decides what a *missing* variable means, and
 * it is the only thing this class says about defaults. Marked optional, an
 * absent variable passes and `EnvironmentService` decides what to hand out in
 * its place; left required, an absent variable fails the boot. A malformed
 * variable fails either way -- optional means "may be absent", never "may be
 * wrong".
 *
 * The names are deliberately unprefixed. `.env` namespaces per service
 * (`BE_API_PORT`, `BE_API_SENTRY_DSN`) and `infra/docker/docker-compose.api.yml`
 * maps those onto the names below, so one `.env` can configure every service
 * without any of them knowing about the others.
 *
 * @see https://docs.nestjs.com/techniques/configuration#custom-validate-function
 */
export class EnvironmentVariables {
  /**
   * What the package this process was started from is called, scope and all.
   *
   * The two `npm_package_*` variables are the odd ones here: nobody writes them
   * into a `.env`. A package manager exports them from the manifest when it runs
   * a script, so `pnpm dev` and `pnpm test` supply them for free -- and so does
   * anything those scripts spawn, which is how the app the nest CLI starts ends
   * up with them. `pnpm exec` and a bare `node dist/main.js` do not, which is
   * why both are optional; in a deployed stage Kubernetes sets them from the
   * image metadata instead.
   *
   * Reading identity from here rather than importing `package.json` keeps the
   * manifest out of the compiled application, and leaves the value overridable
   * by whatever actually launched the process.
   *
   * @see https://docs.npmjs.com/cli/v11/using-npm/scripts#packagejson-vars
   */
  @IsOptional()
  @IsNotEmpty()
  npm_package_name?: string;

  /**
   * The `version` of that same package.
   *
   * `@IsSemVer` rather than a plain string: this reaches the OpenAPI document as
   * the version of the described api, and a client generator has every right to
   * expect something it can compare. A malformed value fails the boot -- optional
   * means "may be absent", never "may be wrong".
   */
  @IsOptional()
  @IsSemVer()
  npm_package_version?: string;

  /**
   * Which stage this process thinks it is running on.
   *
   * Reaches Sentry as the environment tag, so a staging incident is not filed
   * under production.
   */
  @IsOptional()
  @IsEnum(NodeEnvironment)
  NODE_ENV?: NodeEnvironment;

  /** The quietest level Nest's logger still prints. */
  @IsOptional()
  @IsEnum(LogLevel)
  LOG_LEVEL?: LogLevel;

  /**
   * The port the Nest process listens on.
   *
   * Container-internal: Caddy is the only client. The port published to the
   * host is `BE_API_PORT`, which the api never sees.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(65_535)
  API_PORT?: number;

  /**
   * Where Sentry sends events, or absent to disable reporting entirely.
   *
   * Optional because that is the normal case locally, and because an api that
   * refuses to boot without an observability backend is worse than one that
   * boots without it.
   *
   * `require_tld` is off so a self-hosted relay on an internal hostname passes;
   * `require_protocol` then has to be on, because without a tld to insist on,
   * `isUrl` happily reads any single word as a hostname.
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  SENTRY_DSN?: string;

  /** Share of transactions Sentry traces, `0` (none) through `1` (all). */
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  SENTRY_TRACES_SAMPLE_RATE?: number;

  /**
   * The browser origins allowed to call the api, comma separated, or empty to
   * allow every one of them.
   *
   * `https://localhost:4201,https://localhost:4101` locally -- the two Vite dev
   * servers. Entries are origins, not URLs: scheme, host and port and nothing
   * else, because the CORS check compares them to the `Origin` header
   * character for character and a trailing slash silently never matches. That
   * is what `@Matches` is here for; `@IsUrl` alone would wave it through.
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
   * A signed cookie carries an HMAC of its value, which is what lets the api
   * tell a cookie it set from one the browser was talked into holding. Without
   * a secret `cookie-parser` cannot verify any, so `response.cookie(name,
   * value, { signed: true })` throws rather than quietly issuing an unsigned
   * one.
   *
   * Optional because unsigned cookies are a legitimate deployment and the
   * normal case before there is anything to sign. The length floor is not:
   * a guessable secret is worse than no secret, because it makes a forged
   * cookie look verified. Generate one with `make secret`.
   */
  @IsOptional()
  @MinLength(32)
  COOKIE_SECRET?: string;
}

/**
 * Reads the comma separated list `CORS_ORIGINS` arrives as into the array the
 * schema declares.
 *
 * Blank entries are dropped rather than rejected, so a list that grew a
 * trailing comma or was wrapped over two lines still means what it looks like
 * it means. A list of nothing but separators therefore reads as the empty list,
 * which is the same thing as an unset variable: allow every origin.
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
 * `satisfies Partial<EnvironmentVariables>` is what makes this worth having: a
 * default has to be spelled in the type the schema declares, so `API_PORT` is
 * the number `3000` here rather than the string the environment would have
 * supplied, and renaming a variable or changing its type breaks this constant
 * in the same commit. `as const` then keeps the literal types, so a getter
 * returning one of these narrows properly.
 *
 * Listing a value here does *not* apply it. `EnvironmentService` decides that
 * per variable, which is where a default is actually a judgement call: a port
 * can sensibly fall back, a DSN can be absent and mean "reporting off", and a
 * credential should have no entry here at all so that its absence fails the
 * boot instead.
 *
 * @example
 * ```ts
 * get apiPort(): number {
 *   return this.configService.get('API_PORT', { infer: true }) ?? ENVIRONMENT_DEFAULTS.API_PORT;
 * }
 * ```
 */
export const ENVIRONMENT_DEFAULTS = {
  /* What the api is called when nothing said otherwise -- a bare `node
     dist/main.js`, or a test runner started outside a package script. Scoped
     like the manifest is, so `EnvironmentService.serviceName` strips it the same
     way whether the value was supplied or fell back to this. */
  npm_package_name: '@minerva/api',
  /* Deliberately not the current version: an unset variable means nobody told
     this process which build it is, and `0.0.0` says exactly that. A plausible
     number here would be worse than none, because a stale one is unfalsifiable
     -- it looks like a version and reads like a lie only once someone checks. */
  npm_package_version: '0.0.0',
  NODE_ENV: NodeEnvironment.Development,
  LOG_LEVEL: LogLevel.Log,
  API_PORT: 3000,
  SENTRY_TRACES_SAMPLE_RATE: 0,
  CORS_ORIGINS: [],
} as const satisfies Partial<EnvironmentVariables>;
