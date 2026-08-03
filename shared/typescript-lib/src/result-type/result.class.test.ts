import { describe, expect, it } from 'vitest';

import { MinervaError } from '../custom-errors/minerva.error';
import { Result } from './result.class';
import { TestError } from './result.class.example';

describe('Result.withSuccess', () => {
  it('carries the value and reports success', () => {
    const result = Result.withSuccess(42);

    expect(result.isSuccess()).toBe(true);
    expect(result.isFailure()).toBe(false);
    expect(result.value).toBe(42);
    expect(result.error).toBeUndefined();
  });

  it('allows a void success with no value', () => {
    const result = Result.withSuccess();

    expect(result.isSuccess()).toBe(true);
    expect(result.value).toBeUndefined();
  });

  it('narrows to the success value inside the type guard', () => {
    const result: Result<string, TestError> = Result.withSuccess('inv_1');

    if (result.isSuccess()) {
      expect(result.value.toUpperCase()).toBe('INV_1');
    } else {
      throw new Error('expected a success');
    }
  });

  it('keeps falsy values intact', () => {
    expect(Result.withSuccess(0).isSuccess()).toBe(true);
    expect(Result.withSuccess(null).value).toBeNull();
    expect(Result.withSuccess(false).value).toBe(false);
  });
});

describe('Result.withFailure', () => {
  it('carries the error and reports failure', () => {
    const error = new TestError('inv_1');
    const result = Result.withFailure(error);

    expect(result.isFailure()).toBe(true);
    expect(result.isSuccess()).toBe(false);
    expect(result.error).toBe(error);
    expect(result.value).toBeUndefined();
  });

  it('narrows to the typed error inside the type guard', () => {
    const result: Result<string, TestError> = Result.withFailure(new TestError('inv_1'));

    if (result.isFailure()) {
      expect(result.error.code).toBe('ERR_042');
      expect(result.error.payload).toEqual({ invoiceId: 'inv_1' });
    } else {
      throw new Error('expected a failure');
    }
  });
});

describe('Result.is', () => {
  it('recognises a live result, success or failure', () => {
    expect(Result.is(Result.withSuccess(1))).toBe(true);
    expect(Result.is(Result.withFailure(new TestError('inv_1')))).toBe(true);
  });

  it('rejects anything else, including a serialized result', () => {
    expect(Result.is(null)).toBe(false);
    expect(Result.is({ successful: true, value: 1 })).toBe(false);
    expect(Result.is(new TestError('inv_1'))).toBe(false);
    expect(Result.is(JSON.parse(JSON.stringify(Result.withSuccess(1))))).toBe(false);
  });
});

describe('Result#toJSON', () => {
  it('keeps the brand, which the instance itself hides', () => {
    const result = Result.withSuccess(1);

    expect(Object.keys(result)).not.toContain('__brand');
    expect(JSON.parse(JSON.stringify(result))).toMatchObject({
      __brand: '__MinervaResult__',
      successful: true,
      value: 1,
    });
  });
});

describe('Result.hydrate', () => {
  it('round-trips a success through JSON', () => {
    const wire = JSON.stringify(Result.withSuccess({ id: 'inv_1' }));
    const result = Result.hydrate<{ id: string }>(wire);

    expect(Result.is(result)).toBe(true);
    expect(result.isSuccess()).toBe(true);
    expect(result.value).toEqual({ id: 'inv_1' });
  });

  it('accepts an already-parsed payload', () => {
    const result = Result.hydrate<number>(JSON.parse(JSON.stringify(Result.withSuccess(42))));

    expect(result.value).toBe(42);
  });

  it('revives a MinervaError failure with its structured fields', () => {
    const wire = JSON.stringify(Result.withFailure(new TestError('inv_1')));
    const result = Result.hydrate(wire);

    expect(result.isFailure()).toBe(true);

    if (!result.isFailure()) throw new Error('expected a failure');

    expect(MinervaError.is(result.error)).toBe(true);
    expect(result.error.code).toBe('ERR_042');
    expect(result.error.status).toBe(404);
    expect(result.error.message).toBe('This invoice does not exist.');
    expect(result.error.payload).toEqual({ invoiceId: 'inv_1' });
    expect(result.error.name).toBe('TestError');
  });

  it('uses a custom reviver to restore the concrete subclass', () => {
    const wire = JSON.stringify(Result.withFailure(new TestError('inv_1')));
    const result = Result.hydrate<never, TestError>(wire, () => new TestError('inv_1'));

    if (!result.isFailure()) throw new Error('expected a failure');

    expect(result.error).toBeInstanceOf(TestError);
  });

  it('throws on anything that is not a serialized result', () => {
    expect(() => Result.hydrate('{"successful":true}')).toThrow(TypeError);
    expect(() => Result.hydrate({ __brand: 'nope' })).toThrow(TypeError);
    expect(() => Result.hydrate(null)).toThrow(TypeError);
  });
});

describe('Result', () => {
  it('is immutable', () => {
    const result = Result.withSuccess(1) as Result<number> & { value: number };

    expect(() => {
      result.value = 2;
    }).toThrow();
    expect(result.value).toBe(1);
  });
});
