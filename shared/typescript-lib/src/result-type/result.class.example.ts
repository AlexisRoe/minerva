import { MinervaError } from '../custom-errors/minerva.error';

export class TestError extends MinervaError {
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
