import { inspect } from 'node:util';
import { MinervaError } from '@minerva/typescript-lib';
import { type HttpException, HttpStatus } from '@nestjs/common';

/**
 * The api's errors around serving a request, thrown by `MinervaExceptionFilter`
 * to give what it caught a code, a reference and a log level.
 *
 * The usual rules apply: one subclass per {@link ErrorCode}, one hard-coded
 * `reference` per class from `uuidgen`, one line in `errors.registry.ts`.
 *
 * @see {@link ../exception.filter.ts} -- the only thrower
 * @see {@link ../../../../../../../shared/typescript-lib/src/custom-errors/minerva.error.ts} -- the base class
 */

/**
 * A Nest `HttpException` reached the filter -- a 404 for an unknown route, a 400
 * from a `ValidationPipe`, or one a handler raised itself.
 *
 * Keeps the exception's status, and takes the log level from it: a 4xx is the
 * caller's fault and gets `warn`, a 5xx gets `error`. Only the latter is
 * captured, which is what keeps mistyped URLs out of Sentry. The payload carries
 * `getResponse()`, where Nest puts the detail a validation failure rejected on.
 *
 * @see https://docs.nestjs.com/exception-filters#built-in-http-exceptions
 */
export class HttpRequestError extends MinervaError {
  constructor(cause?: HttpException) {
    const status = cause?.getStatus() ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const stack = cause?.stack ?? '<non-found>';
    const detail = cause?.getResponse();
    const logLevel = status >= HttpStatus.INTERNAL_SERVER_ERROR ? 'error' : 'warn';

    super({
      reference: '3910ce24-5dd9-4fe1-815e-b31ef45695e2',
      code: 'ERR_002',
      message: cause?.message ?? 'Minerva could not serve this request.',
      status,
      logLevel,
      payload: { exception: cause?.name, detail, stack },
      cause,
    });
  }
}

/**
 * Something that is neither a `MinervaError` nor an `HttpException` reached the
 * filter -- always a bug, so always a 500 at `error`.
 *
 * `thrown` is `unknown` because JavaScript allows throwing anything. An `Error`
 * becomes the `cause` and keeps its stack; anything else is inspected into the
 * payload, bounded, since an unknown value can be arbitrarily large.
 */
export class UnexpectedError extends MinervaError {
  constructor(thrown?: unknown) {
    const cause = thrown instanceof Error ? thrown : undefined;
    const isDescribable = cause === undefined && thrown !== undefined;

    const payload = isDescribable
      ? { thrown: inspect(thrown, { depth: 1, maxStringLength: 256, maxArrayLength: 10 }) }
      : undefined;

    super({
      reference: '3f2c01d5-0fad-45b2-b3bc-b8f2558b7d10',
      code: 'ERR_003',
      message: 'Minerva could not complete this request.',
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      logLevel: 'error',
      payload,
      cause,
    });
  }
}
