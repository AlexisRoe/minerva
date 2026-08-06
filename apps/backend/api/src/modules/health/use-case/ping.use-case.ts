import { Result, type UseCase } from '@minerva/typescript-lib';

/** Classic ping->pong game */
const DEFAULT_PING_ANSWER = 'pong';

/** Answers a liveness probe, and nothing else. */
export class PingUseCase implements UseCase<void, string> {
  async execute(): Promise<Result<string>> {
    return Result.withSuccess(DEFAULT_PING_ANSWER);
  }
}
