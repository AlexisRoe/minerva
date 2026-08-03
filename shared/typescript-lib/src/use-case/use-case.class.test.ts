import { describe, expect, it } from 'vitest';

import { CountInvoices, InvoiceNotFoundError, LoadInvoice, makeInvoices } from './use-case.class.example';

const invoices = makeInvoices();

describe('UseCase', () => {
  it('resolves an async execute to a success result', async () => {
    const result = await new LoadInvoice(invoices).execute({ invoiceId: 'inv_1' });

    expect(result.isSuccess()).toBe(true);
    expect(result.value).toEqual({ id: 'inv_1', amount: 100 });
  });

  it('returns the declared failure instead of throwing', async () => {
    const result = await new LoadInvoice(invoices).execute({ invoiceId: 'missing' });

    if (!result.isFailure()) {
      throw new Error('expected a failure');
    }

    expect(result.error).toBeInstanceOf(InvoiceNotFoundError);
    expect(result.error.code).toBe('ERR_042');
  });

  it('narrows to the success value inside the type guard', async () => {
    const result = await new LoadInvoice(invoices).execute({ invoiceId: 'inv_1' });

    if (result.isSuccess()) {
      expect(result.value.id.toUpperCase()).toBe('INV_1');
    } else {
      throw new Error('expected a success');
    }
  });

  it('supports a synchronous execute with no input', () => {
    const result = new CountInvoices(invoices).execute();

    expect(result.isSuccess()).toBe(true);
    expect(result.value).toBe(1);
  });

  it('awaits a synchronous execute just as well', async () => {
    const result = await new CountInvoices(invoices).execute();

    expect(result.value).toBe(1);
  });

  it('keeps constructor dependencies per instance', async () => {
    const empty = new LoadInvoice(new Map());
    const result = await empty.execute({ invoiceId: 'inv_1' });

    expect(result.isFailure()).toBe(true);
  });
});
