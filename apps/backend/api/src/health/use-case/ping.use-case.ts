import { Result, type UseCase } from '@minerva/typescript-lib';

/** Classic ping->pong game */
const DEFAULT_PING_ANSWER = 'pong';

/**
 * Answers a liveness probe, and nothing else.
 *
 * The cheapest proof that the process is up and routing works: it touches no
 * dependency, so a `pong` says the api itself is alive and says nothing at all
 * about the database, the queue or anything downstream — that is what makes it
 * usable as a container or load balancer probe.
 */
export class PingUseCase implements UseCase<void, string> {
  async execute(): Promise<Result<string>> {
    return Result.withSuccess(DEFAULT_PING_ANSWER);
  }
}
