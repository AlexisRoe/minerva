import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApiStatus } from '../../enum/status.enum';

/**
 * What `GET /health` answers with: the liveness verdict and who gave it.
 *
 * A class rather than an interface because the decorators need something that
 * survives compilation — `class-validator` and `class-transformer` both read
 * metadata off the constructor at runtime, which an erased interface cannot
 * carry. Its shape is still plain, so a use-case can return an object literal
 * for it without constructing one.
 */
export class RootResponse {
  @ApiProperty({
    description: '`ok` while the process can serve traffic, `error` when it knows it cannot.',
    enum: ApiStatus,
    /* Named, so the generated document carries one reusable `ApiStatus` schema
       rather than repeating the members at every use. */
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
