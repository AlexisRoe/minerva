import { Result, type UseCase } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';
import { ApiStatus } from '../../../enum/status.enum';
import { EnvironmentService } from '../../../plattform/environment/service/environment.service';
import type { HealthResponse } from '../dto/health.response';

/**
 * Reports whether the api is healthy, and which service answered.
 *
 * The verdict behind `GET /health` and behind both Kubernetes probes: a machine
 * reads `status` to decide whether to keep sending traffic, a human reads `name`
 * to know which service replied when the response turns up in a log or behind a
 * proxy. Verdict only — it returns what this process knows about itself and
 * never probes a dependency.
 */
@Injectable()
export class HealthUseCase implements UseCase<void, HealthResponse> {
  constructor(private readonly environment: EnvironmentService) {}

  async execute(): Promise<Result<HealthResponse>> {
    return Result.withSuccess({ status: ApiStatus.Ok, name: this.environment.serviceName });
  }
}
