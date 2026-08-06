import { Module } from '@nestjs/common';

import { HealthController } from './controller/health.controller';
import { RootUseCase } from './use-case/health-root.use-case';
import { PingUseCase } from './use-case/ping.use-case';

@Module({
  controllers: [HealthController],
  // Without these the controller's dependencies cannot be resolved and the
  // whole app fails to bootstrap, not just these routes.
  providers: [PingUseCase, RootUseCase],
})
export class HealthModule {}
