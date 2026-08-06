import { type EmailJob, isEmailJobKind } from '@minerva/typescript-lib';
import { BadRequestException, Body, Controller, Post } from '@nestjs/common';

import { AppService } from './app.service';

interface CreateJobBody {
  kind?: unknown;
  messageId?: unknown;
}

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('jobs')
  createJob(@Body() body: CreateJobBody): EmailJob {
    if (!isEmailJobKind(body.kind) || typeof body.messageId !== 'string') {
      throw new BadRequestException('Expected { kind: "parse" | "screenshot", messageId: string }');
    }

    return this.appService.createJob(body.kind, body.messageId);
  }
}
