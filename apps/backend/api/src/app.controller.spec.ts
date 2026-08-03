import { isEmailJob } from '@minerva/typescript-lib';
import { BadRequestException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppController } from './app.controller';
import { AppService } from './app.service';

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
    expect(appController.health()).toEqual({ status: 'ok', service: 'api' });
  });

  it('creates a job matching the shared contract', () => {
    const job = appController.createJob({ kind: 'parse', messageId: 'AAMkAD' });

    expect(isEmailJob(job)).toBe(true);
    expect(job.kind).toBe('parse');
    expect(job.messageId).toBe('AAMkAD');
  });

  it('rejects an unknown job kind', () => {
    expect(() => appController.createJob({ kind: 'render', messageId: 'AAMkAD' })).toThrow(BadRequestException);
  });
});
