import { type EmailJob, isEmailJobKind } from '@minerva/typescript-lib';
import { BadRequestException, Body, Controller, Get, Post } from '@nestjs/common';

import { AppService, type HealthReport } from './app.service';

interface CreateJobBody {
  kind?: unknown;
  messageId?: unknown;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  health(): HealthReport {
    return this.appService.health();
  }

  @Post('jobs')
  createJob(@Body() body: CreateJobBody): EmailJob {
    if (!isEmailJobKind(body.kind) || typeof body.messageId !== 'string') {
      throw new BadRequestException('Expected { kind: "parse" | "screenshot", messageId: string }');
    }

    return this.appService.createJob(body.kind, body.messageId);
  }
}
