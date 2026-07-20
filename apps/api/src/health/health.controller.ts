import type { HealthResponse } from '@minerva/shared';
import { Controller, Get } from '@nestjs/common';
import { HealthService } from './health.service';

const API_VERSION = process.env.npm_package_version ?? '0.0.0';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  check(): Promise<HealthResponse> {
    return this.healthService.check(API_VERSION);
  }
}
