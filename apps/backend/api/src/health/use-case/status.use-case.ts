import { Result, type UseCase } from '@minerva/typescript-lib';
import { Injectable } from '@nestjs/common';
import { STUB_REQUEST_ID } from '../../constants/request.constants';
import { ApiStatus } from '../../enum/status.enum';
import { EnvironmentService } from '../../plattform/environment/environment.service';
import type { StatusResponse } from '../dto/status.response';

/**
 * Reports who this process is, which build it runs and what time it thinks it
 * is.
 *
 * The route a human opens when something is wrong, where {@link HealthUseCase}
 * is the one a machine polls. It answers the questions a bug report starts with
 * -- which instance answered, running what, when -- so that a screenshot of it
 * is worth something on its own.
 *
 * `date` is generated per call rather than at construction: a timestamp frozen
 * at boot would answer "when did this start" while looking like "when did you
 * answer", and comparing it against the reader's clock is half of what the field
 * is for.
 *
 * `requestId` is {@link STUB_REQUEST_ID} until request ids are wired up. The
 * shape of the response is settled now so that clients and the OpenAPI document
 * do not have to change when the value becomes real.
 */
@Injectable()
export class StatusUseCase implements UseCase<void, StatusResponse> {
  constructor(private readonly environment: EnvironmentService) {}

  /**
   * Answers with the full identity of this process, as of now.
   *
   * @example
   * ```ts
   * const result = await statusUseCase.execute();
   * // Result.withSuccess({
   * //   status: 'ok',
   * //   name: 'api',
   * //   version: '0.1.0',
   * //   date: '2026-08-06T09:41:12.004Z',
   * //   requestId: 'not-yet-wired',
   * // })
   * ```
   */
  async execute(): Promise<Result<StatusResponse>> {
    return Result.withSuccess({
      status: ApiStatus.Ok,
      name: this.environment.serviceName,
      version: this.environment.serviceVersion,
      date: new Date().toISOString(),
      requestId: STUB_REQUEST_ID,
    });
  }
}
