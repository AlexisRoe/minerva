import type { UUID } from 'node:crypto';
import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { RequestWithRequestId } from './request-id.interface';

/**
 * Hands a handler the id of the request it is answering.
 *
 * The counterpart of `RequestIdMiddleware`: normally the middleware has already
 * settled the id and this reads it off the request, which is what keeps the id
 * in the body identical to the one in the response header.
 *
 * When it has not -- a route the middleware chain does not reach, a handler
 * called outside HTTP -- this falls back to the same two steps the middleware
 * takes, reading {@link RequestIdHeader} through the same `toRequestId`, and
 * attaches the result so that a second read within the request agrees with the
 * first. Repairing rather than throwing keeps the parameter a plain `string`
 * for every handler, and one rule about what a usable id is: whichever of the
 * two runs first, the answer is the same.
 *
 * @example
 * ```ts
 * @Get('status')
 * async status(@RequestId() requestId: string): Promise<StatusResponse> {
 *   return this.statusUseCase.execute({ requestId });
 * }
 * ```
 *
 * @see https://docs.nestjs.com/custom-decorators#param-decorators
 */
export const RequestId = createParamDecorator((_data: unknown, context: ExecutionContext): UUID => {
  const request = context.switchToHttp().getRequest<RequestWithRequestId>();

  return request.requestId;
});
