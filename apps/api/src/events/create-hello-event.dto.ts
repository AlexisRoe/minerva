import type { HelloEventRequest } from '@minerva/shared';
import { IsString, Length } from 'class-validator';

export class CreateHelloEventDto implements HelloEventRequest {
  @IsString()
  @Length(1, 500)
  message!: string;
}
