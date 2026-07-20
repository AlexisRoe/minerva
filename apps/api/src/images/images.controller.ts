import type { CamoSignResponse } from '@minerva/shared';
import { Body, Controller, Post } from '@nestjs/common';
import { CamoService } from './camo.service';
import { SignImageDto } from './sign-image.dto';

@Controller('images')
export class ImagesController {
  constructor(private readonly camoService: CamoService) {}

  @Post('sign')
  sign(@Body() dto: SignImageDto): CamoSignResponse {
    return { proxyUrl: this.camoService.sign(dto.url) };
  }
}
