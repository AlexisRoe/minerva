import { beforeEach, describe, expect, it } from 'vitest';

import { ConfigRequestFailedError } from '@/domain/errors/config.errors';
import { ERROR_LOG_LIMIT, ERROR_LOG_STORAGE_KEY, useErrorLogStore } from './error-log.store';

function logMany(count: number): void {
  for (let index = 0; index < count; index += 1) {
    useErrorLogStore.getState().log(new Error(`error ${index}`));
  }
}

beforeEach(() => {
  localStorage.clear();
  useErrorLogStore.setState({ entries: [] });
});

describe('useErrorLogStore', () => {
  it('starts empty', () => {
    expect(useErrorLogStore.getState().entries).toEqual([]);
  });

  it('keeps the newest error first', () => {
    useErrorLogStore.getState().log(new Error('older'));
    useErrorLogStore.getState().log(new Error('newer'));

    expect(useErrorLogStore.getState().entries.map((entry) => entry.message)).toEqual(['newer', 'older']);
  });

  it('records a Minerva error with its code', () => {
    useErrorLogStore.getState().log(new ConfigRequestFailedError('/config.json', 404, 'Not Found'));

    expect(useErrorLogStore.getState().entries[0]).toMatchObject({ code: 'ERR_001' });
  });

  it(`keeps at most ${ERROR_LOG_LIMIT} errors`, () => {
    logMany(ERROR_LOG_LIMIT + 10);

    expect(useErrorLogStore.getState().entries).toHaveLength(ERROR_LOG_LIMIT);
  });

  it('drops the oldest once full, not the newest', () => {
    logMany(ERROR_LOG_LIMIT + 1);
    const messages = useErrorLogStore.getState().entries.map((entry) => entry.message);

    expect(messages[0]).toBe(`error ${ERROR_LOG_LIMIT}`);
    expect(messages).not.toContain('error 0');
  });

  it('gives every entry its own id and a timestamp', () => {
    logMany(3);
    const entries = useErrorLogStore.getState().entries;

    expect(new Set(entries.map((entry) => entry.id)).size).toBe(3);
    for (const entry of entries) {
      expect(Number.isNaN(Date.parse(entry.loggedAt))).toBe(false);
    }
  });

  it('persists the entries, so they outlive the page', () => {
    useErrorLogStore.getState().log(new Error('kept'));

    const stored = JSON.parse(localStorage.getItem(ERROR_LOG_STORAGE_KEY) ?? '{}');
    expect(stored.state.entries[0]).toMatchObject({ message: 'kept' });
    expect(stored.version).toBe(1);
  });

  it('persists the entries only, not the actions', () => {
    useErrorLogStore.getState().log(new Error('kept'));

    const stored = JSON.parse(localStorage.getItem(ERROR_LOG_STORAGE_KEY) ?? '{}');
    expect(Object.keys(stored.state)).toEqual(['entries']);
  });

  it('clears memory and storage together', () => {
    logMany(3);
    useErrorLogStore.getState().clear();

    expect(useErrorLogStore.getState().entries).toEqual([]);
    const stored = JSON.parse(localStorage.getItem(ERROR_LOG_STORAGE_KEY) ?? '{}');
    expect(stored.state.entries).toEqual([]);
  });
});
