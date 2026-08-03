import { afterEach, describe, expect, it, vi } from 'vitest';

import { getErrorLogStorage } from './error-log.storage';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getErrorLogStorage', () => {
  it('uses localStorage when it works', () => {
    expect(getErrorLogStorage()).toBe(window.localStorage);
  });

  it('leaves no probe key behind', () => {
    getErrorLogStorage();

    expect(window.localStorage.length).toBe(0);
  });

  it('falls back when localStorage is absent', () => {
    vi.stubGlobal('localStorage', undefined);

    expect(getErrorLogStorage()).not.toBe(window.localStorage);
  });

  it('falls back when writing throws, as it does on a full quota', () => {
    vi.stubGlobal('localStorage', {
      setItem: () => {
        throw new DOMException('QuotaExceededError');
      },
    });

    const storage = getErrorLogStorage();
    expect(() => storage.setItem('k', 'v')).not.toThrow();
    expect(storage.getItem('k')).toBe('v');
  });

  it('is a usable Storage once it has fallen back', () => {
    vi.stubGlobal('localStorage', undefined);
    const storage = getErrorLogStorage();
    // The fallback is one module-level instance, so an earlier case may have
    // left something in it.
    storage.clear();

    storage.setItem('a', '1');
    storage.setItem('b', '2');

    expect(storage.length).toBe(2);
    expect(storage.key(0)).toBe('a');
    expect(storage.getItem('a')).toBe('1');

    storage.removeItem('a');
    expect(storage.getItem('a')).toBeNull();

    storage.clear();
    expect(storage.length).toBe(0);
  });
});
