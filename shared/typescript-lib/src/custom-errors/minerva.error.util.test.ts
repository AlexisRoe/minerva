import { describe, expect, it } from 'vitest';

import { MinervaError } from './minerva.error';
import {
  CONSOLE_METHOD,
  convertToSentryLevel,
  hasMinervaBrand,
  NEST_LOGGER_METHOD,
  serializeCause,
} from './minerva.error.util';

/** Every level a `MinervaError` can carry, so a table cannot quietly miss one. */
const LOG_LEVELS = ['log', 'info', 'debug', 'warn', 'error', 'fatal'] as const;

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

describe('CONSOLE_METHOD', () => {
  it('names a method for every level, so no error is logged through undefined', () => {
    for (const level of LOG_LEVELS) {
      expect(typeof console[CONSOLE_METHOD[level]]).toBe('function');
    }
  });

  it('folds fatal onto error, which is as loud as a console gets', () => {
    expect(CONSOLE_METHOD.fatal).toBe('error');
    expect(CONSOLE_METHOD.info).toBe('info');
  });
});

describe('NEST_LOGGER_METHOD', () => {
  it('names a method for every level, so no error is logged through undefined', () => {
    for (const level of LOG_LEVELS) {
      expect(NEST_LOGGER_METHOD[level]).toEqual(expect.any(String));
    }
  });

  it('differs from the console table at the two ends where the vocabularies do', () => {
    /* Nest has a `fatal` of its own and no `info` -- the console is the other way
       round, which is why one table could not serve both. */
    expect(NEST_LOGGER_METHOD.fatal).toBe('fatal');
    expect(NEST_LOGGER_METHOD.info).toBe('log');
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
