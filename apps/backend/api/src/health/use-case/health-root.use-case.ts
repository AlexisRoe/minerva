import { Result, type UseCase } from '@minerva/typescript-lib';
import type { RootResponse } from '../dto/root.response';

/**
 * Reports whether the api is healthy, and which service answered.
 *
 * The verdict behind `GET /health`: a machine reads `status` to decide whether
 * to keep sending traffic, a human reads `name` to know which service replied
 * when the response turns up in a log or behind a proxy. Verdict only — it
 * returns what this process knows about itself and never probes a dependency.
 */
export class RootUseCase implements UseCase<void, RootResponse> {
  async execute(): Promise<Result<RootResponse>> {
    return Result.withSuccess({ status: 'ok', name: 'api' });
  }
}
