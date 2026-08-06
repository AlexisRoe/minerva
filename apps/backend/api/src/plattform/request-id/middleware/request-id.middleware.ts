import { randomUUID, type UUID } from 'node:crypto';
import { Injectable, type NestMiddleware } from '@nestjs/common';
import { isString, isUUID } from 'class-validator';
import type { NextFunction, Response } from 'express';
import { REQUEST_ID_HEADER } from '../../../constants/request.constants';
import type { RequestWithRequestId } from '../interface/request-id.interface';

/**
 * Gives every request an id, and tells the caller which one it got.
 *
 * The first thing that runs on a request and the reason anything downstream can
 * assume an id exists: it takes {@link RequestIdHeader} if the caller sent a
 * usable one and mints a uuid otherwise, so a handler never has to decide
 * between the two. `toRequestId` holds that decision, including what makes an
 * incoming value unusable.
 *
 * The id is written to two places on purpose. On the request, where
 * `@RequestId()` and any future logger read it; and back onto the response,
 * where it is the only way a caller who did *not* send one can name the request
 * later -- without the echo, the api and its caller each hold half a trace and
 * no way to join them.
 *
 * @see https://docs.nestjs.com/middleware
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: RequestWithRequestId, response: Response, next: NextFunction): void {
    const requestHeader = request.header(REQUEST_ID_HEADER);

    const isValidRequestId = isString(requestHeader) && isUUID(requestHeader, '4');
    const requestId: UUID = isValidRequestId ? (requestHeader as UUID) : randomUUID();

    response.setHeader(REQUEST_ID_HEADER, requestId);
    request.requestId = requestId;

    next();
  }
}
