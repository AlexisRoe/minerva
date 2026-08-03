import { MinervaError } from '../custom-errors/minerva.error';
import { Result } from '../result-type/result.class';
import type { UseCase } from './use-case.class';

export class InvoiceNotFoundError extends MinervaError {
  constructor(invoiceId: string) {
    super({
      code: 'ERR_042',
      reference: '00000000-0000-4000-8000-000000000000',
      message: 'This invoice does not exist.',
      status: 404,
      payload: { invoiceId },
    });
  }
}

export type Invoice = { id: string; amount: number };

export class LoadInvoice implements UseCase<{ invoiceId: string }, Invoice, InvoiceNotFoundError> {
  constructor(private readonly invoices: Map<string, Invoice>) {}

  async execute({ invoiceId }: { invoiceId: string }) {
    const invoice = this.invoices.get(invoiceId);

    return invoice
      ? Result.withSuccess<Invoice, InvoiceNotFoundError>(invoice)
      : Result.withFailure<Invoice, InvoiceNotFoundError>(new InvoiceNotFoundError(invoiceId));
  }
}

export class CountInvoices implements UseCase<void, number> {
  constructor(private readonly invoices: Map<string, Invoice>) {}

  execute() {
    return Result.withSuccess<number>(this.invoices.size);
  }
}

export const makeInvoices = () => new Map<string, Invoice>([['inv_1', { id: 'inv_1', amount: 100 }]]);
