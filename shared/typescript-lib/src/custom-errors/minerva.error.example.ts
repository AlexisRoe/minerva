import { MinervaError } from './minerva.error';

export const REFERENCE = '5c2c98ee-4e18-4283-9b08-4774807c185a';

export const makeError = (): MinervaError =>
  new MinervaError({
    reference: REFERENCE,
    code: 'ERR_001',
    message: 'Something went wrong.',
    status: 404,
    logLevel: 'warn',
    payload: { invoiceId: 'inv_1' },
  });

export class InvoiceNotFoundError extends MinervaError {
  constructor(invoiceId: string, cause?: Error) {
    super({
      reference: REFERENCE,
      code: 'ERR_042',
      message: 'This invoice does not exist.',
      status: 404,
      payload: { invoiceId },
      cause,
    });
  }
}
