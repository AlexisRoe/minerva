import { isEmailJob } from '@minerva/typescript-lib';
import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';

import { AppService, type HealthReport } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health(): HealthReport {
    return this.appService.health();
  }

  @Get('jobs')
  depth(): { depth: number } {
    return { depth: this.appService.depth() };
  }

  @Post('jobs')
  accept(@Body() body: unknown): { accepted: boolean; depth: number } {
    if (!isEmailJob(body)) {
      throw new BadRequestException('Body is not a valid EmailJob');
    }

    return this.appService.accept(body);
  }
}
