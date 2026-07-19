import type { CamoSignRequest } from '@minerva/shared';
import { IsUrl } from 'class-validator';

export class SignImageDto implements CamoSignRequest {
  @IsUrl({ protocols: ['https'], require_protocol: true })
  url!: string;
}
