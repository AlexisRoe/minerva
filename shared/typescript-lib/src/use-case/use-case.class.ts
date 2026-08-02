import type { MinervaError } from '../custom-errors/minerva.error';
import type { Result } from '../result-type/result.class';

/**
 * What a use case hands back: a {@link Result}, or a promise of one.
 *
 * An implementation picks one side by declaring `execute` `async` or not — the
 * caller is not allowed to care, and always `await`s.
 */
export type UseCaseOutput<S, F extends Error> = Result<S, F> | Promise<Result<S, F>>;

/**
 * The call signature of `execute`, with the input argument made optional when
 * `TInput` is `void` — so a use case that takes nothing is called as `execute()`.
 */
export type UseCaseArgs<TInput> = unknown extends TInput ? [input?: TInput] : [input: TInput];

/**
 * Base class for a single piece of business logic, invoked through `execute`.
 *
 * One use case, one class, one public method. `TInput` is everything it needs
 * (use `void` for nothing), `TSuccess` is what it produces, `TFailure` is
 * *which errors the caller has to handle* — best given as a union of concrete
 * {@link MinervaError} subclasses, so the failure branch is exhaustive at
 * compile time. Failure is returned, never thrown.
 *
 * Dependencies (repositories, clients, clocks) arrive through the constructor,
 * which is what keeps a use case testable without mocking a framework.
 *
 * @example Defining one — `async` is optional, the caller `await`s either way
 * ```ts
 * type Input = { invoiceId: string };
 *
 * class PayInvoice implements UseCase<Input, Invoice, InvoiceNotFoundError | CardDeclinedError> {
 *   constructor(private readonly invoices: InvoiceRepository) {}
 *
 *   async execute({ invoiceId }: Input) {
 *     const invoice = await this.invoices.find(invoiceId);
 *
 *     return invoice
 *       ? Result.withSuccess(await this.invoices.pay(invoice))
 *       : Result.withFailure(new InvoiceNotFoundError(invoiceId));
 *   }
 * }
 * ```
 *
 * @example Calling one — the compiler forces the failure branch
 * ```ts
 * const result = await new PayInvoice(invoices).execute({ invoiceId: 'inv_1' });
 *
 * if (result.isFailure()) {
 *   return showToast(t(result.error.code));  // InvoiceNotFoundError | CardDeclinedError
 * }
 *
 * render(result.value);                      // Invoice
 * ```
 *
 * @example A use case that takes no input
 * ```ts
 * class CountInvoices implements UseCase<void, number> {
 *   execute() {
 *     return Result.withSuccess(invoices.length);
 *   }
 * }
 *
 * await new CountInvoices().execute();
 * ```
 */
export abstract class UseCase<TInput = void, TSuccess = void, TFailure extends Error = MinervaError> {
  /**
   * Runs the business logic. Implement it `async` or not, as the work requires.
   *
   * Return a failed {@link Result} for every expected failure; only a genuine
   * bug should escape as a thrown error.
   */
  abstract execute(...args: UseCaseArgs<TInput>): UseCaseOutput<TSuccess, TFailure>;
}
