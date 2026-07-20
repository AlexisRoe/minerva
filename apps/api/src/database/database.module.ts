import { Global, Module } from '@nestjs/common';
import { PrismaRoService } from './prisma-ro.service';
import { PrismaRwService } from './prisma-rw.service';

@Global()
@Module({
  providers: [PrismaRwService, PrismaRoService],
  exports: [PrismaRwService, PrismaRoService],
})
export class DatabaseModule {}
