import { describe, expect, it } from 'vitest';
import { MinervaError } from './minerva.error';
import { InvoiceNotFoundError, makeError, REFERENCE } from './minerva.error.example';

describe('MinervaError', () => {
  it('is a real Error and can be thrown', () => {
    const error = makeError();

    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(MinervaError);
    expect(() => {
      throw error;
    }).toThrow('Something went wrong.');
  });

  it('keeps the props it was given', () => {
    const error = makeError();

    expect(error.reference).toBe(REFERENCE);
    expect(error.code).toBe('ERR_001');
    expect(error.message).toBe('Something went wrong.');
    expect(error.status).toBe(404);
    expect(error.logLevel).toBe('warn');
    expect(error.payload).toEqual({ invoiceId: 'inv_1' });
  });

  it('defaults status and logLevel', () => {
    const error = new MinervaError({ reference: REFERENCE, code: 'ERR_002', message: 'Boom.' });

    expect(error.status).toBe(500);
    expect(error.logLevel).toBe('error');
    expect(error.payload).toBeUndefined();
  });

  it('keeps the cause', () => {
    const cause = new Error('socket hang up');
    const error = new InvoiceNotFoundError('inv_1', cause);

    expect(error.cause).toBe(cause);
  });
});

describe('MinervaError subclasses', () => {
  it('keep their own prototype and name', () => {
    const error = new InvoiceNotFoundError('inv_1');

    expect(error).toBeInstanceOf(InvoiceNotFoundError);
    expect(error).toBeInstanceOf(MinervaError);
    expect(error.name).toBe('InvoiceNotFoundError');
    expect(error.stack).toContain('InvoiceNotFoundError');
  });

  it('are catchable as MinervaError', async () => {
    const failing = async (): Promise<never> => {
      throw new InvoiceNotFoundError('nope');
    };

    await expect(failing()).rejects.toThrow(InvoiceNotFoundError);
    await expect(failing()).rejects.toThrow(MinervaError);
  });
});

describe('MinervaError.is', () => {
  it('accepts Minerva errors and their subclasses', () => {
    expect(MinervaError.is(makeError())).toBe(true);
    expect(MinervaError.is(new InvoiceNotFoundError('inv_1'))).toBe(true);
  });

  it('rejects anything else', () => {
    expect(MinervaError.is(new Error('plain'))).toBe(false);
    expect(MinervaError.is('ERR_001')).toBe(false);
    expect(MinervaError.is(null)).toBe(false);
    expect(MinervaError.is(undefined)).toBe(false);
    expect(MinervaError.is({ code: 'ERR_001' })).toBe(false);
    expect(MinervaError.is({ __brand: 'something else' })).toBe(false);
  });

  it('accepts a branded error from another realm, where instanceof fails', () => {
    /* What a second copy of this package produces: same brand, foreign prototype. */
    const foreign = Object.assign(new Error('Something went wrong.'), { __brand: '__MinervaError__' });

    expect(foreign).not.toBeInstanceOf(MinervaError);
    expect(MinervaError.is(foreign)).toBe(true);
  });
});

describe('MinervaError brand', () => {
  it('is hidden from enumeration, spreads and JSON', () => {
    const error = makeError();

    expect(Object.keys(error)).not.toContain('__brand');
    expect({ ...error }).not.toHaveProperty('__brand');
    expect(JSON.parse(JSON.stringify(error))).not.toHaveProperty('__brand');
  });

  it('cannot be reassigned', () => {
    const error = makeError();

    expect(() => {
      Object.defineProperty(error, '__brand', { value: 'spoofed' });
    }).toThrow();
    expect(MinervaError.is(error)).toBe(true);
  });

  it('is set on subclasses too', () => {
    expect(Object.getOwnPropertyDescriptor(new InvoiceNotFoundError('inv_1'), '__brand')).toMatchObject({
      value: '__MinervaError__',
      enumerable: false,
    });
  });
});

describe('MinervaError#toJSON', () => {
  it('survives JSON.stringify with message and stack intact', () => {
    const parsed = JSON.parse(JSON.stringify(makeError()));

    expect(parsed).toMatchObject({
      name: 'MinervaError',
      code: 'ERR_001',
      reference: REFERENCE,
      message: 'Something went wrong.',
      status: 404,
      logLevel: 'warn',
      payload: { invoiceId: 'inv_1' },
    });
    expect(parsed.stack).toEqual(expect.any(String));
  });

  it('unwraps a plain cause', () => {
    const error = new InvoiceNotFoundError('inv_1', new Error('socket hang up'));

    expect(error.toJSON().cause).toMatchObject({ name: 'Error', message: 'socket hang up' });
  });

  it('flattens a Minerva cause to name, message and stack', () => {
    const outer = new InvoiceNotFoundError('inv_1', makeError());

    expect(outer.toJSON().cause).toMatchObject({
      name: 'MinervaError',
      message: 'Something went wrong.',
    });
    // The cause is flattened, so its own code and payload do not survive.
    expect(outer.toJSON().cause).not.toHaveProperty('code');
  });

  it('omits the cause when there is none', () => {
    expect(makeError().toJSON().cause).toBeUndefined();
  });
});
