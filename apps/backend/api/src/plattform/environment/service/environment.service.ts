import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { LogLevel, NodeEnvironment } from '../../../enum/environment.enum';
import { ENVIRONMENT_DEFAULTS, type EnvironmentVariables } from '../interface/environment.interface';
import { toServiceName } from '../utils/environment.util';

/**
 * Typed, read-only access to the environment this process booted with, and the
 * one place that decides what a variable the environment did not set means.
 *
 * Whatever comes back from here has already been through `validateEnvironment`
 * as the `validate` hook of `ConfigModule.forRoot`, so it is legal or the
 * process is already dead. What is left to settle is absence, and that is a
 * different question per variable: {@link apiPort} falls back to
 * {@link ENVIRONMENT_DEFAULTS}, {@link cookieSecret} does not fall back at all
 * because absent is a meaningful answer, and a variable with neither would have
 * failed validation for being required.
 *
 * Keeping that decision in the getters is the point. A default applied during
 * validation is invisible at the call site and impossible to opt out of;
 * applied here, each variable states its own rule once, in the type the rest of
 * the code consumes.
 *
 * This is also the only place in the api allowed to read configuration.
 * Reaching for `process.env` directly bypasses the validation and gives back a
 * string where the rest of the code expects a number.
 *
 * @example
 * ```ts
 * constructor(private readonly environment: EnvironmentService) {}
 *
 * connect() {
 *   return listen(this.environment.apiPort);
 * }
 * ```
 *
 * @see https://docs.nestjs.com/techniques/configuration#using-the-configservice
 */
@Injectable()
export class EnvironmentService {
  constructor(private readonly configService: ConfigService<EnvironmentVariables>) {}

  /**
   * What this service is called -- `api`, unscoped from the `@minerva/api` a
   * package manager exports as `npm_package_name`.
   *
   * This is what distinguishes a `GET /health` body from the queue-coordinator's
   * identically shaped one, so it has to follow a rename of the package rather
   * than be restated next to it. Unscoped because the scope names the workspace,
   * which every reader of that response already knows.
   *
   * @example
   * ```ts
   * return { status: ApiStatus.Ok, name: environment.serviceName };
   * ```
   */
  get serviceName(): string {
    return toServiceName(
      this.configService.get('npm_package_name', { infer: true }) ?? ENVIRONMENT_DEFAULTS.npm_package_name,
    );
  }

  /**
   * Which build this is, from the manifest of whatever started the process.
   *
   * Falls back to {@link ENVIRONMENT_DEFAULTS}' `0.0.0`, which is not a version
   * anything ships under: the api was launched by something that does not export
   * `npm_package_version` -- a bare `node dist/main.js`, `pnpm exec`, a pod
   * missing the variable -- and saying so is more useful than a number that
   * happens to have been right when it was typed.
   *
   * @example
   * ```ts
   * new DocumentBuilder().setVersion(environment.serviceVersion);
   * ```
   */
  get serviceVersion(): string {
    return this.configService.get('npm_package_version', { infer: true }) ?? ENVIRONMENT_DEFAULTS.npm_package_version;
  }

  /**
   * Which stage this process is running on, defaulting to the least privileged
   * one so a forgotten variable never claims production.
   *
   * @example
   * ```ts
   * Sentry.init({ environment: this.environment.nodeEnv });
   * ```
   */
  get nodeEnv(): NodeEnvironment {
    return this.configService.get('NODE_ENV', { infer: true }) ?? ENVIRONMENT_DEFAULTS.NODE_ENV;
  }

  /**
   * The quietest level Nest's logger should still print, defaulting to Nest's
   * own choice.
   *
   * @example
   * ```ts
   * if (environment.logLevel === 'debug') {
   *   dumpTheWholeRequest(request);
   * }
   * ```
   */
  get logLevel(): LogLevel {
    return this.configService.get('LOG_LEVEL', { infer: true }) ?? ENVIRONMENT_DEFAULTS.LOG_LEVEL;
  }

  /**
   * {@link logLevel} and everything louder, in the shape `useLogger` wants.
   *
   * Nest takes the exact set of levels to print, not a threshold: handing it
   * `['warn']` would silence `error` and `fatal` as well. {@link LogLevel} is
   * declared quietest-first for precisely this reason, so the tail of its
   * members from the configured level is the set to enable.
   *
   * @example
   * ```ts
   * app.useLogger(environment.logLevels);   // LOG_LEVEL=warn -> warn, error, fatal
   * ```
   *
   * @see https://docs.nestjs.com/techniques/logger#log-levels
   */
  get logLevels(): LogLevel[] {
    const levels = Object.values(LogLevel);

    return levels.slice(levels.indexOf(this.logLevel));
  }

  /**
   * The container-internal port the api listens on, defaulting to the one the
   * Dockerfile exposes.
   *
   * @example
   * ```ts
   * await app.listen(environment.apiPort);
   * ```
   */
  get apiPort(): number {
    return this.configService.get('API_PORT', { infer: true }) ?? ENVIRONMENT_DEFAULTS.API_PORT;
  }

  /**
   * The browser origins allowed to call the api, empty for every origin.
   *
   * Empty is the honest answer for an unset variable rather than a locked-down
   * one: this api has no browser client yet, and a guessed allow-list would
   * reject the first one to arrive with a CORS error that looks like a bug in
   * the frontend. `ServerService` is where that empty list turns into a policy.
   *
   * @example
   * ```ts
   * app.enableCors({ origin: environment.corsOrigins.length > 0 ? [...environment.corsOrigins] : true });
   * ```
   */
  get corsOrigins(): readonly string[] {
    return this.configService.get('CORS_ORIGINS', { infer: true }) ?? ENVIRONMENT_DEFAULTS.CORS_ORIGINS;
  }

  /**
   * The key cookies are signed with, or `undefined` when none are signed.
   *
   * No fallback, for the opposite reason {@link apiPort} has one: a generated
   * stand-in would let signed cookies appear to work while every restart
   * silently invalidated the ones already issued.
   *
   * @example
   * ```ts
   * app.use(cookieParser(environment.cookieSecret));
   * ```
   */
  get cookieSecret(): string | undefined {
    return this.configService.get('COOKIE_SECRET', { infer: true });
  }

  /**
   * The Postgres connection URI, or `undefined` where none was configured.
   *
   * No fallback, on the same reasoning as {@link cookieSecret}: a stand-in would
   * be a connection to somewhere nobody meant, and "no database configured" is a
   * thing the caller can act on while "the wrong database" is not.
   *
   * @example
   * ```ts
   * new PrismaClient({ datasourceUrl: environment.databaseUrl });
   * ```
   */
  get databaseUrl(): string | undefined {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  /**
   * The Valkey connection URI, or `undefined` where none was configured.
   *
   * @example
   * ```ts
   * new Queue('email', { connection: { url: environment.valkeyUrl } });
   * ```
   */
  get valkeyUrl(): string | undefined {
    return this.configService.get('VALKEY_URL', { infer: true });
  }

  /**
   * Which logical Valkey database each concern uses.
   *
   * Returned as one object rather than three getters because they are only ever
   * meaningful together -- the point of the split is that the three numbers
   * differ, and reading one without knowing the others cannot tell you that.
   *
   * @example
   * ```ts
   * new Redis(environment.valkeyUrl, { db: environment.valkeyDatabases.queue });
   * ```
   */
  get valkeyDatabases(): { queue: number; cache: number; sse: number } {
    return {
      queue: this.configService.get('VALKEY_DB_QUEUE', { infer: true }) ?? ENVIRONMENT_DEFAULTS.VALKEY_DB_QUEUE,
      cache: this.configService.get('VALKEY_DB_CACHE', { infer: true }) ?? ENVIRONMENT_DEFAULTS.VALKEY_DB_CACHE,
      sse: this.configService.get('VALKEY_DB_SSE', { infer: true }) ?? ENVIRONMENT_DEFAULTS.VALKEY_DB_SSE,
    };
  }

  /**
   * Everything needed to talk to the object store, or `undefined` when it has not
   * been configured.
   *
   * All of it or none of it: an endpoint without credentials is not a partially
   * working object store, it is a series of 403s at the first upload. Checking
   * once here is what lets a caller treat a returned object as usable.
   *
   * The bucket names and the region carry defaults because they are names this
   * repository chose, not secrets -- see {@link ENVIRONMENT_DEFAULTS}.
   *
   * @example
   * ```ts
   * const s3 = environment.objectStorage;
   * if (!s3) throw new Error('Object storage is not configured');
   * new S3Client({ endpoint: s3.endpoint, region: s3.region, credentials: s3.credentials });
   * ```
   */
  get objectStorage():
    | {
        endpoint: string;
        region: string;
        credentials: { accessKeyId: string; secretAccessKey: string };
        buckets: { assets: string; artifacts: string };
        publicBaseUrl: string | undefined;
      }
    | undefined {
    const endpoint = this.configService.get('S3_ENDPOINT', { infer: true });
    const accessKeyId = this.configService.get('S3_ACCESS_KEY_ID', { infer: true });
    const secretAccessKey = this.configService.get('S3_SECRET_ACCESS_KEY', { infer: true });

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return undefined;
    }

    return {
      endpoint,
      region: this.configService.get('S3_REGION', { infer: true }) ?? ENVIRONMENT_DEFAULTS.S3_REGION,
      credentials: { accessKeyId, secretAccessKey },
      buckets: {
        assets: this.configService.get('S3_BUCKET_ASSETS', { infer: true }) ?? ENVIRONMENT_DEFAULTS.S3_BUCKET_ASSETS,
        artifacts:
          this.configService.get('S3_BUCKET_ARTIFACTS', { infer: true }) ?? ENVIRONMENT_DEFAULTS.S3_BUCKET_ARTIFACTS,
      },
      // Optional even when the rest is present: an object store the api can write
      // to does not have to be one a browser can read from.
      publicBaseUrl: this.configService.get('S3_PUBLIC_BASE_URL', { infer: true }),
    };
  }

  /**
   * The image proxy's origin and signing key, or `undefined` when it has not been
   * configured.
   *
   * Both together for the same reason {@link objectStorage} groups its parts: a
   * camo URL without a signature is refused, so an origin on its own is of no use
   * to anyone.
   *
   * @example
   * ```ts
   * const camo = environment.imageProxy;
   * return camo ? signCamoUrl(camo, remoteImageUrl) : undefined;
   * ```
   *
   * @see https://github.com/cactus/go-camo
   */
  get imageProxy(): { baseUrl: string; key: string } | undefined {
    const baseUrl = this.configService.get('CAMO_BASE_URL', { infer: true });
    const key = this.configService.get('CAMO_KEY', { infer: true });

    return baseUrl && key ? { baseUrl, key } : undefined;
  }

  /**
   * Where to hand a job to the queue coordinator, or `undefined` where it has not
   * been configured.
   *
   * Always a container-network address -- the coordinator is not published and
   * has no hostname a browser could resolve.
   *
   * @example
   * ```ts
   * await fetch(`${environment.queueCoordinatorUrl}/jobs`, { method: 'POST', body });
   * ```
   */
  get queueCoordinatorUrl(): string | undefined {
    return this.configService.get('QUEUE_COORDINATOR_URL', { infer: true });
  }

  /**
   * Whether this is the production stage.
   *
   * Phrased as "is it production" rather than "is it not development", so a
   * stage added later is treated as untrusted until someone says otherwise.
   *
   * @example
   * ```ts
   * if (environment.isProduction) {
   *   app.enableShutdownHooks();
   * }
   * ```
   */
  get isProduction(): boolean {
    return this.nodeEnv === NodeEnvironment.Production;
  }

  /**
   * Whether this is the development stage.
   *
   * @example
   * ```ts
   * if (environment.isDevelopment) {
   *   app.enableCors();
   * }
   * ```
   */
  get isDevelopment(): boolean {
    return this.nodeEnv === NodeEnvironment.Development;
  }
}
