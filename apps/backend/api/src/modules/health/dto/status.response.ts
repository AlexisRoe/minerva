import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsSemVer, IsString } from 'class-validator';
import { HealthResponse } from './health.response';

/**
 * What `GET /health/status` answers with: the liveness verdict, plus everything
 * needed to say *which* process gave it and *when*.
 *
 * Extends {@link HealthResponse} rather than restating it, so the probe routes
 * and this one cannot drift apart: `status` and `name` mean the same thing here
 * as they do there, and Nest folds the inherited properties into the generated
 * schema.
 */
export class StatusResponse extends HealthResponse {
  @ApiProperty({
    description: 'The build that answered, so a report can be pinned to a release rather than to `main`.',
    example: '0.1.0',
    pattern: '^d+.d+.d+$',
  })
  @Expose()
  @IsSemVer()
  version: string;

  @ApiProperty({
    description:
      'When this response was produced, in UTC. Read against the clock of whoever received it, it also shows how far the two have drifted.',
    format: 'date-time',
    example: '2026-08-06T09:41:12.004Z',
  })
  @Expose()
  @IsISO8601()
  date: string;

  @ApiProperty({
    description:
      'The id correlating this response with the request that caused it, and with the log lines either produced.',
    example: '3f1c9f9e-6f2a-4c2b-9a1e-2f0d5f7c8b31',
    format: 'uuid',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  requestId: string;
}
