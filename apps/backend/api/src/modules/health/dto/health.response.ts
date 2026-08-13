import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiStatus } from '../../../enum/status.enum';

/**
 * What a liveness answer carries: the verdict and who gave it.
 *
 * One shape behind `GET /health`, `/health/live` and `/health/ready`, so a probe
 * that moves from one to another finds the body it already parses, and a human
 * reading three of them side by side compares like with like.
 * {@link StatusResponse} extends it for the one route that reports more than a
 * verdict.
 */
export class HealthResponse {
  @ApiProperty({
    description: '`ok` while the process can serve traffic, `error` when it knows it cannot.',
    enum: ApiStatus,
    /* Names the enum, which is what emits it as a reusable schema instead of inlining the values per property. */
    enumName: 'ApiStatus',
    example: ApiStatus.Ok,
  })
  @Expose()
  @IsEnum(ApiStatus)
  status: ApiStatus;

  @ApiProperty({
    description: 'The service that answered, so a response read out of context is still attributable.',
    example: 'api',
  })
  @Expose()
  @IsString()
  @IsNotEmpty()
  name: string;
}
