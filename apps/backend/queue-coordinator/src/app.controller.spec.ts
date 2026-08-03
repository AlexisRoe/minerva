import type { EmailJob } from '@minerva/typescript-lib';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

const job: EmailJob = {
  id: 'job-1',
  kind: 'parse',
  messageId: 'AAMkAD',
  enqueuedAt: '2026-07-27T12:00:00.000Z',
};

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    // Compiling the module proves decorator metadata survived the transform —
    // without it Nest cannot resolve AppService into the controller.
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  it('reports health', () => {
    expect(appController.health()).toEqual({ status: 'ok', service: 'queue-coordinator' });
  });

  it('accepts a job once and reports the queue depth', () => {
    expect(appController.accept(job)).toEqual({ accepted: true, depth: 1 });
    expect(appController.accept(job)).toEqual({ accepted: false, depth: 1 });
    expect(appController.depth()).toEqual({ depth: 1 });
  });

  it('rejects a payload that is not a job', () => {
    expect(() => appController.accept({ kind: 'parse' })).toThrow(BadRequestException);
  });
});
