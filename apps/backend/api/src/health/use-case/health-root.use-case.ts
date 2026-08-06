import { Result, type UseCase } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';
import { ApiStatus } from '../../enum/status.enum';
import { EnvironmentService } from '../../plattform/environment/environment.service';
import type { RootResponse } from '../dto/root.response';

/**
 * Reports whether the api is healthy, and which service answered.
 *
 * The verdict behind `GET /health`: a machine reads `status` to decide whether
 * to keep sending traffic, a human reads `name` to know which service replied
 * when the response turns up in a log or behind a proxy. Verdict only — it
 * returns what this process knows about itself and never probes a dependency.
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
export class RootUseCase implements UseCase<void, RootResponse> {
  constructor(private readonly environment: EnvironmentService) {}

  async execute(): Promise<Result<RootResponse>> {
    return Result.withSuccess({ status: ApiStatus.Ok, name: this.environment.serviceName });
  }
}
