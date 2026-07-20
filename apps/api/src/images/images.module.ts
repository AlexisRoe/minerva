import { Module } from '@nestjs/common';
import { CamoService } from './camo.service';
import { ImagesController } from './images.controller';

@Module({
  controllers: [ImagesController],
  providers: [CamoService],
})
export class ImagesModule {}
