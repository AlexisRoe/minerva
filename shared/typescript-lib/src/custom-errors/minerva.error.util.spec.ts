import { describe, expect, it } from 'vitest';

import { MinervaError } from './minerva.error';
import { convertToSentryLevel, hasMinervaBrand, serializeCause } from './minerva.error.util';

describe('convertToSentryLevel', () => {
  it('renames warn to Sentry warning', () => {
    expect(convertToSentryLevel('warn')).toBe('warning');
  });

  it('passes the levels Sentry already knows through unchanged', () => {
    expect(convertToSentryLevel('fatal')).toBe('fatal');
    expect(convertToSentryLevel('error')).toBe('error');
    expect(convertToSentryLevel('log')).toBe('log');
    expect(convertToSentryLevel('info')).toBe('info');
    expect(convertToSentryLevel('debug')).toBe('debug');
  });
});

describe('hasMinervaBrand', () => {
  it('accepts anything carrying the brand, whatever its prototype', () => {
    expect(hasMinervaBrand({ __brand: '__MinervaError__' })).toBe(true);
    expect(hasMinervaBrand(Object.assign(new Error('boom'), { __brand: '__MinervaError__' }))).toBe(true);
    expect(hasMinervaBrand(Object.assign(() => {}, { __brand: '__MinervaError__' }))).toBe(true);
  });

  it('rejects a wrong brand, a missing brand and non-objects', () => {
    expect(hasMinervaBrand({ __brand: 'something else' })).toBe(false);
    expect(hasMinervaBrand(new Error('plain'))).toBe(false);
    expect(hasMinervaBrand('__MinervaError__')).toBe(false);
    expect(hasMinervaBrand(null)).toBe(false);
    expect(hasMinervaBrand(undefined)).toBe(false);
  });
});

describe('serializeCause', () => {
  it('flattens an Error to name, message and stack', () => {
    const cause = serializeCause(new TypeError('socket hang up'));

    expect(cause).toMatchObject({ name: 'TypeError', message: 'socket hang up' });
    expect(cause?.stack).toEqual(expect.any(String));
  });

  it('flattens a MinervaError without its code and payload', () => {
    const cause = serializeCause(
      new MinervaError({
        reference: '5c2c98ee-4e18-4283-9b08-4774807c185a',
        code: 'ERR_001',
        message: 'Something went wrong.',
        payload: { invoiceId: 'inv_1' },
      }),
    );

    expect(cause).toMatchObject({ name: 'MinervaError', message: 'Something went wrong.' });
    expect(cause).not.toHaveProperty('code');
    expect(cause).not.toHaveProperty('payload');
  });

  it('drops everything that is not an Error', () => {
    expect(serializeCause('socket hang up')).toBeUndefined();
    expect(serializeCause({ name: 'Error', message: 'lookalike' })).toBeUndefined();
    expect(serializeCause(null)).toBeUndefined();
    expect(serializeCause(undefined)).toBeUndefined();
  });
});
