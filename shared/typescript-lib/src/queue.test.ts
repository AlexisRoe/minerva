import { describe, expect, it } from 'vitest';

import { EMAIL_JOB_KINDS, type EmailJob, isEmailJob, isEmailJobKind } from './index';

const job: EmailJob = {
  id: 'job-1',
  kind: 'parse',
  messageId: 'AAMkAD...',
  enqueuedAt: '2026-07-27T12:00:00.000Z',
};

describe('isEmailJobKind', () => {
  it('accepts every declared kind', () => {
    expect(EMAIL_JOB_KINDS.every(isEmailJobKind)).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isEmailJobKind('render')).toBe(false);
    expect(isEmailJobKind(undefined)).toBe(false);
  });
});

describe('isEmailJob', () => {
  it('accepts a well-formed job', () => {
    expect(isEmailJob(job)).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(isEmailJob(null)).toBe(false);
    expect(isEmailJob({ ...job, kind: 'render' })).toBe(false);
    expect(isEmailJob({ ...job, id: 42 })).toBe(false);
  });
});
