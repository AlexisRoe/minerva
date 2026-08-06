import { Controller, Get } from '@nestjs/common';

import type { RootResponse } from '../dto/root.response';
import { RootUseCase } from '../use-case/health-root.use-case';
import { PingUseCase } from '../use-case/ping.use-case';

@Controller('health')
export class HealthController {
  constructor(
    private readonly pingUseCase: PingUseCase,
    private readonly rootUseCase: RootUseCase,
  ) {}

  @Get()
  async root(): Promise<RootResponse> {
    const result = await this.rootUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }

  @Get('ping')
  async ping(): Promise<string> {
    const result = await this.pingUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }
}
