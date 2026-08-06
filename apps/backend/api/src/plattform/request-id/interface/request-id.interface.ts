import type { UUID } from 'node:crypto';
import type { Request } from 'express';

/**
 * A request that has been through `RequestIdMiddleware`, and therefore has an
 * id.
 *
 * An explicit type rather than a `declare global` augmentation of Express's
 * `Request`: the global version would put an optional `requestId` on every
 * request object in the api, including the ones that have not reached the
 * middleware yet, and every reader would then have to handle an absence that
 * cannot actually happen. Naming the post-middleware shape keeps the guarantee
 * where it is true, and makes the cast at the one place that performs it -- the
 * middleware itself -- visible rather than implicit.
 *
 * @example
 * ```ts
 * const { requestId } = context.switchToHttp().getRequest<RequestWithRequestId>();
 * ```
 */
export interface RequestWithRequestId extends Request {
  /** The id correlating this request with the logs and response it produced. */
  requestId: UUID;
}
