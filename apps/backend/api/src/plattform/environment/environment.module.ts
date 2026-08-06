import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnvironmentService } from './service/environment.service';
import { validateEnvironment } from './utils/environment.util';

/**
 * Validates the environment once and exports {@link EnvironmentService} to the
 * whole application.
 *
 * `@Global` because configuration is not a domain concern: making every feature
 * module import this one would add a line to each of them and say nothing.
 *
 * `ignoreEnvFile` because loading `.env` is not this service's job: under
 * `make api` compose has already put the variables into the process through
 * `env_file`, and from a shell node's own `--env-file` does the same. A second
 * reader with its own idea of where the file lives is one more thing that can
 * disagree with the container.
 *
 * `skipProcessEnv` is what makes the validated snapshot the only source.
 * `ConfigService` otherwise falls back to `process.env` for anything the
 * snapshot does not have, which quietly undoes the work: `COOKIE_SECRET=` would
 * come back as `''` instead of `undefined`, and every value would come back as
 * the string it was before conversion.
 *
 * `cache` is safe here for the same reason it usually is not: the configuration
 * is a frozen snapshot taken at boot, and nothing in the api rewrites
 * `process.env` afterwards.
 *
 * @see https://docs.nestjs.com/techniques/configuration
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      ignoreEnvFile: true,
      skipProcessEnv: true,
      validate: validateEnvironment,
    }),
  ],
  providers: [EnvironmentService],
  exports: [EnvironmentService],
})
export class EnvironmentModule {}
