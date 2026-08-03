import { describe, expect, it } from 'vitest';

import { isNonEmptyString, isObjectLike, isValidPort } from './validator.utils';

describe('isObjectLike', () => {
  it('accepts anything that can hold properties', () => {
    expect(isObjectLike({})).toBe(true);
    expect(isObjectLike([])).toBe(true);
    expect(isObjectLike(new Error('boom'))).toBe(true);
    expect(isObjectLike(() => {})).toBe(true);
  });

  it('rejects null and primitives', () => {
    expect(isObjectLike(null)).toBe(false);
    expect(isObjectLike(undefined)).toBe(false);
    expect(isObjectLike('ERR_001')).toBe(false);
    expect(isObjectLike(0)).toBe(false);
    expect(isObjectLike(false)).toBe(false);
  });
});

describe('isNonEmptyString', () => {
  it('accepts a string with content', () => {
    expect(isNonEmptyString('minerva')).toBe(true);
    expect(isNonEmptyString(' padded ')).toBe(true);
  });

  it('rejects blank strings and non-strings', () => {
    expect(isNonEmptyString('')).toBe(false);
    expect(isNonEmptyString('   ')).toBe(false);
    expect(isNonEmptyString('\n\t')).toBe(false);
    expect(isNonEmptyString(undefined)).toBe(false);
    expect(isNonEmptyString(null)).toBe(false);
    expect(isNonEmptyString(42)).toBe(false);
  });
});

describe('isValidPort', () => {
  it('accepts the TCP range', () => {
    expect(isValidPort(1)).toBe(true);
    expect(isValidPort(4301)).toBe(true);
    expect(isValidPort(65535)).toBe(true);
  });

  it('rejects out-of-range, fractional and non-numeric values', () => {
    expect(isValidPort(0)).toBe(false);
    expect(isValidPort(-1)).toBe(false);
    expect(isValidPort(65536)).toBe(false);
    expect(isValidPort(80.5)).toBe(false);
    expect(isValidPort(Number.NaN)).toBe(false);
    expect(isValidPort(Number.POSITIVE_INFINITY)).toBe(false);
  });
});
