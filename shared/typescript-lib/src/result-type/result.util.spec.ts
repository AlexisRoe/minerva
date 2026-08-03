import { describe, expect, it } from 'vitest';

import { MinervaError } from '../custom-errors/minerva.error';
import { hasResultBrand, isSerializedResult, reviveError } from './result.util';

const serialized = {
  __brand: '__MinervaResult__',
  successful: true,
  value: 1,
};

describe('hasResultBrand', () => {
  it('accepts anything carrying the brand', () => {
    expect(hasResultBrand(serialized)).toBe(true);
    expect(hasResultBrand({ __brand: '__MinervaResult__' })).toBe(true);
  });

  it('rejects other brands, primitives and null', () => {
    expect(hasResultBrand({ __brand: '__MinervaError__' })).toBe(false);
    expect(hasResultBrand({})).toBe(false);
    expect(hasResultBrand(null)).toBe(false);
    expect(hasResultBrand('__MinervaResult__')).toBe(false);
  });
});

describe('isSerializedResult', () => {
  it('requires the brand and a boolean discriminator', () => {
    expect(isSerializedResult(serialized)).toBe(true);
    expect(isSerializedResult({ __brand: '__MinervaResult__' })).toBe(false);
    expect(isSerializedResult({ successful: true })).toBe(false);
  });
});

describe('reviveError', () => {
  it('rebuilds a MinervaError from its serialized shape', () => {
    const original = new MinervaError({
      code: 'ERR_042',
      reference: '00000000-0000-4000-8000-000000000000',
      message: 'This invoice does not exist.',
      status: 404,
      logLevel: 'warn',
      payload: { invoiceId: 'inv_1' },
    });

    const revived = reviveError(JSON.parse(JSON.stringify(original)));

    expect(MinervaError.is(revived)).toBe(true);

    if (!MinervaError.is(revived)) throw new Error('expected a MinervaError');

    expect(revived.code).toBe('ERR_042');
    expect(revived.reference).toBe('00000000-0000-4000-8000-000000000000');
    expect(revived.logLevel).toBe('warn');
    expect(revived.payload).toEqual({ invoiceId: 'inv_1' });
  });

  it('falls back to a plain Error when the structured fields are missing', () => {
    const revived = reviveError({ name: 'TypeError', message: 'boom' });

    expect(MinervaError.is(revived)).toBe(false);
    expect(revived.message).toBe('boom');
  });

  it('handles values that are not objects at all', () => {
    expect(reviveError('boom').message).toBe('boom');
    expect(reviveError(undefined).message).toBe('Unknown error');
  });
});
