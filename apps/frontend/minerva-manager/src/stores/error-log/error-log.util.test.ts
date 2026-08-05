import { describe, expect, it } from 'vitest';

import { ConfigRequestFailedError } from '@/domain/errors/config.errors';
import { toLoggedError } from './error-log.util';

const id = 'entry-1';
const loggedAt = '2026-01-01T00:00:00.000Z';

describe('toLoggedError', () => {
  it('keeps everything a Minerva error knows about itself', () => {
    const error = new ConfigRequestFailedError('/config.json', 404, 'Not Found');

    expect(toLoggedError(error, id, loggedAt)).toMatchObject({
      id,
      loggedAt,
      name: 'ConfigRequestFailedError',
      code: 'ERR_001',
      reference: error.reference,
      payload: { path: '/config.json', status: 404, statusText: 'Not Found' },
    });
  });

  it('flattens a plain error', () => {
    const error = new TypeError('boom');

    expect(toLoggedError(error, id, loggedAt)).toMatchObject({
      id,
      loggedAt,
      name: 'TypeError',
      message: 'boom',
    });
  });

  it('keeps a thrown non-error rather than dropping it', () => {
    expect(toLoggedError('boom', id, loggedAt)).toMatchObject({ name: 'UnknownError', message: 'boom' });
    expect(toLoggedError(undefined, id, loggedAt)).toMatchObject({ message: 'undefined' });
    expect(toLoggedError({ nope: true }, id, loggedAt)).toMatchObject({ name: 'UnknownError' });
  });

  it('produces something JSON-safe, since the entry is written to storage', () => {
    const error = new ConfigRequestFailedError('/config.json', 500, 'Server Error', new Error('offline'));
    const entry = toLoggedError(error, id, loggedAt);

    expect(() => JSON.stringify(entry)).not.toThrow();
    expect(JSON.parse(JSON.stringify(entry))).toMatchObject({ cause: { name: 'Error', message: 'offline' } });
  });
});
