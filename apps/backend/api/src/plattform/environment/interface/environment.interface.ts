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
 * `infra/docker/docker-compose.yml` maps those onto the names below.
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

  /**
   * Where Postgres is, as a libpq connection URI.
   *
   * Optional because nothing in the api connects to a database yet: the variable
   * is wired through `infra/docker/docker-compose.yml` so that the value is
   * validated the day the first query is written, rather than discovered to be
   * malformed by whatever tries to use it. `@IsUrl` is not the check here --
   * `postgres://` is not a URL scheme it recognises -- so the shape is asserted
   * directly.
   */
  @IsOptional()
  @Matches(/^postgres(ql)?:\/\/\S+$/, { message: 'DATABASE_URL must be a postgres:// connection URI' })
  DATABASE_URL?: string;

  /**
   * Where Valkey is, as a `redis://` URI. Same reasoning as
   * {@link EnvironmentVariables.DATABASE_URL}: validated now, connected to later.
   *
   * `redis://` rather than `valkey://`, because that is the scheme every client
   * library still parses.
   */
  @IsOptional()
  @Matches(/^rediss?:\/\/\S+$/, { message: 'VALKEY_URL must be a redis:// connection URI' })
  VALKEY_URL?: string;

  /**
   * The logical Valkey database the job queues live in.
   *
   * Three of them are assigned -- queues, cache, SSE -- so that a `FLUSHDB` aimed
   * at one cannot take the others with it. The numbering is a convention held in
   * `.env.template`; Valkey enforces nothing.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(15)
  VALKEY_DB_QUEUE?: number;

  /** The logical Valkey database cached values live in. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(15)
  VALKEY_DB_CACHE?: number;

  /**
   * The logical Valkey database the SSE fan-out uses.
   *
   * Note that pub/sub is *not* database-scoped: a message published on one
   * database reaches a subscriber on any other. This number keeps the ordinary
   * keys apart; keeping the channels apart is a matter of naming them.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(15)
  VALKEY_DB_SSE?: number;

  /**
   * The S3 API of the Garage node, as a URL.
   *
   * Plain `http://garage:3900` in the compose stack: the call never leaves the
   * container network, so there is no TLS to terminate. Distinct from
   * {@link EnvironmentVariables.S3_PUBLIC_BASE_URL}, which is where a browser
   * reads the public bucket from.
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  S3_ENDPOINT?: string;

  /**
   * The region the S3 request signature is computed over.
   *
   * Arbitrary for Garage -- `garage` is what `infra/garage/garage.toml` declares
   * -- but it has to be the same string on both sides or every request fails
   * verification with an error that says nothing about regions.
   */
  @IsOptional()
  @IsNotEmpty()
  S3_REGION?: string;

  /** The access key id the api signs S3 requests with. */
  @IsOptional()
  @IsNotEmpty()
  S3_ACCESS_KEY_ID?: string;

  /**
   * The secret half of that key pair. No length floor: unlike
   * {@link EnvironmentVariables.COOKIE_SECRET} this one is not something anyone
   * chooses -- it is whatever the object store was told to accept.
   */
  @IsOptional()
  @IsNotEmpty()
  S3_SECRET_ACCESS_KEY?: string;

  /** The public bucket, whose objects are readable in a browser without signing. */
  @IsOptional()
  @IsNotEmpty()
  S3_BUCKET_ASSETS?: string;

  /** The private bucket, reachable only through a signed S3 call. */
  @IsOptional()
  @IsNotEmpty()
  S3_BUCKET_ARTIFACTS?: string;

  /**
   * The origin an object in the public bucket is readable from, with no trailing
   * slash -- `https://assets.localhost:4501` locally.
   *
   * Not derivable from {@link EnvironmentVariables.S3_ENDPOINT}: that is the
   * signed API on the container network, this is the website endpoint through
   * Caddy, and only the latter serves a bucket unauthenticated.
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  @Matches(/^https?:\/\/[^/?#]+$/, { message: 'S3_PUBLIC_BASE_URL must be an origin without a path' })
  S3_PUBLIC_BASE_URL?: string;

  /**
   * Where the go-camo image proxy answers, with no trailing slash.
   *
   * Remote images in a reported email are rewritten to point here, so that no
   * third party learns the reader's IP from the act of reading.
   *
   * @see https://github.com/cactus/go-camo
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  @Matches(/^https?:\/\/[^/?#]+$/, { message: 'CAMO_BASE_URL must be an origin without a path' })
  CAMO_BASE_URL?: string;

  /**
   * The HMAC key camo URLs are signed with, shared with the proxy itself.
   *
   * Without a matching signature camo refuses the request, which is what keeps it
   * from being an open proxy for anyone who finds the port. 64 hexadecimal
   * characters, as `make secret HEX=1` produces.
   */
  @IsOptional()
  @Matches(/^[0-9a-f]{64}$/, { message: 'CAMO_KEY must be 64 hexadecimal characters' })
  CAMO_KEY?: string;

  /**
   * Where the queue coordinator answers, on the container network.
   *
   * `http://queue-coordinator:4301` and nothing else: the coordinator is not
   * published and has no Caddy site block, so a URL naming a hostname a browser
   * could resolve would be a mistake.
   */
  @IsOptional()
  @IsUrl({ protocols: ['http', 'https'], require_tld: false, require_protocol: true })
  QUEUE_COORDINATOR_URL?: string;
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
  // The Valkey keyspace layout from `.env.template`. Safe to default because a
  // wrong guess here is a wrong database, not a wrong credential -- and 0, 1, 2
  // is the layout every part of the stack is written against.
  VALKEY_DB_QUEUE: 0,
  VALKEY_DB_CACHE: 1,
  VALKEY_DB_SSE: 2,
  S3_REGION: 'garage',
  S3_BUCKET_ASSETS: 'assets',
  S3_BUCKET_ARTIFACTS: 'artifacts',
} as const satisfies Partial<EnvironmentVariables>;
