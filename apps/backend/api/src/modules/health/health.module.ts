import { Module } from '@nestjs/common';

import { HealthController } from './controller/health.controller';
import { HealthUseCase } from './use-case/health.use-case';
import { PingUseCase } from './use-case/ping.use-case';
import { StatusUseCase } from './use-case/status.use-case';

@Module({
  controllers: [HealthController],
  providers: [PingUseCase, HealthUseCase, StatusUseCase],
})
export class HealthModule {}
