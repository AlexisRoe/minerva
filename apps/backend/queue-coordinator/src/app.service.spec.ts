import type { EmailJob } from '@minerva/typescript-lib';
import { beforeEach, describe, expect, it } from 'vitest';

import { AppService } from './app.service';

const parseJob: EmailJob = {
  id: 'job-1',
  kind: 'parse',
  messageId: 'AAMkAD',
  enqueuedAt: '2026-07-27T12:00:00.000Z',
};

const screenshotJob: EmailJob = { ...parseJob, id: 'job-2', kind: 'screenshot' };

describe('AppService', () => {
  let service: AppService;

  beforeEach(() => {
    service = new AppService();
  });

  it('claims the oldest job of the requested kind', () => {
    service.accept(parseJob);
    service.accept(screenshotJob);

    expect(service.claim('screenshot')).toEqual(screenshotJob);
    expect(service.depth()).toBe(1);
  });

  it('returns null when nothing matches', () => {
    expect(service.claim('parse')).toBeNull();
  });
});
