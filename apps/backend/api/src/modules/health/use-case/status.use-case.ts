import type { UUID } from 'node:crypto';
import { Result, type UseCase } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';
import { ApiStatus } from '../../../enum/status.enum';
import { EnvironmentService } from '../../../plattform/environment/service/environment.service';
import type { StatusResponse } from '../dto/status.response';

export interface StatusInput {
  /** The id of the request being answered, as settled by `RequestIdMiddleware` */
  requestId: UUID;
}

/**
 * Reports who this process is, which build it runs and what time it thinks it
 * is.
 *
 * The route a human opens when something is wrong, where {@link HealthUseCase}
 * is the one a machine polls. It answers the questions a bug report starts with
 * -- which instance answered, running what, when, and under which id its log
 * lines were written -- so that a screenshot of it is worth something on its
 * own.
 */
@Injectable()
export class StatusUseCase implements UseCase<StatusInput, StatusResponse> {
  constructor(private readonly environment: EnvironmentService) {}

  async execute({ requestId }: StatusInput): Promise<Result<StatusResponse>> {
    return Result.withSuccess({
      status: ApiStatus.Ok,
      name: this.environment.serviceName,
      version: this.environment.serviceVersion,
      date: new Date().toISOString(),
      requestId,
    });
  }
}
