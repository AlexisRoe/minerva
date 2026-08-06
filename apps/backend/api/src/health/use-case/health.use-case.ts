import { Result, type UseCase } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';
import { ApiStatus } from '../../enum/status.enum';
import { EnvironmentService } from '../../plattform/environment/environment.service';
import type { HealthResponse } from '../dto/health.response';

/**
 * Reports whether the api is healthy, and which service answered.
 *
 * The verdict behind `GET /health` and behind both Kubernetes probes: a machine
 * reads `status` to decide whether to keep sending traffic, a human reads `name`
 * to know which service replied when the response turns up in a log or behind a
 * proxy. Verdict only — it returns what this process knows about itself and
 * never probes a dependency.
 *
 * One use case for all three routes on purpose. Liveness and readiness ask
 * different questions, but this api has nothing to be un-ready for yet, so today
 * the answers coincide; two implementations of one sentence would only drift.
 * The *routes* are what a deployment binds to and they are already separate, so
 * the day readiness has something to check, only this layer changes.
 *
 * `name` comes from {@link EnvironmentService}, which reads it off the package
 * manager's `npm_package_name`, rather than from a literal here. The whole value
 * of the field is that it is the service's real identity; a literal only says
 * what someone once typed, and would survive a rename of the package unchanged.
 *
 * `@Injectable` is load-bearing now that there is a constructor: Nest resolves
 * dependencies from `design:paramtypes`, and TypeScript only emits that metadata
 * for a class carrying at least one decorator.
 */
@Injectable()
export class HealthUseCase implements UseCase<void, HealthResponse> {
  constructor(private readonly environment: EnvironmentService) {}

  /**
   * Answers with this process's verdict on itself.
   *
   * @example
   * ```ts
   * const result = await healthUseCase.execute();
   * // Result.withSuccess({ status: 'ok', name: 'api' })
   * ```
   */
  async execute(): Promise<Result<HealthResponse>> {
    return Result.withSuccess({ status: ApiStatus.Ok, name: this.environment.serviceName });
  }
}
