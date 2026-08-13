import type { UUID } from 'node:crypto';
import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ApiDocumentationTags } from '../../../enum/api-documentation.enum';
import { RequestId } from '../../../plattform/request-id/decorators/request-id.decorator';
import { HealthResponse } from '../dto/health.response';
import { StatusResponse } from '../dto/status.response';
import { HealthUseCase } from '../use-case/health.use-case';
import { PingUseCase } from '../use-case/ping.use-case';
import { StatusUseCase } from '../use-case/status.use-case';

/**
 * Everything the api will say about itself without being asked about anything
 * else.
 *
 * Four of the five routes are for machines and differ in who is expected to call
 * them, not in what they return: `/health` for whatever is in front of the
 * process, `/health/live` and `/health/ready` for the two Kubernetes probes,
 * `/health/ping` for a check that has to be cheap enough to run every second.
 * Separate routes because a deployment binds a probe to a *path* -- once
 * readiness means more than liveness, the manifests already point at the right
 * one and do not need rolling out again.
 *
 * `/health/status` is the odd one out, and the only one meant for a person.
 *
 * @see https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/
 */
@ApiTags(ApiDocumentationTags.Health)
@Controller('health')
export class HealthController {
  constructor(
    private readonly pingUseCase: PingUseCase,
    private readonly healthUseCase: HealthUseCase,
    private readonly statusUseCase: StatusUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report the liveness verdict',
    description:
      'Returns what this process knows about itself. It probes no database, queue or downstream service, so `ok` means the api is up and routing works — nothing more.',
  })
  @ApiOkResponse({ description: 'The process can serve traffic.', type: HealthResponse })
  async root(): Promise<HealthResponse> {
    const result = await this.healthUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }

  @Get('live')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Answer the Kubernetes liveness probe',
    description:
      'Returns the same verdict as `GET /health`. A non-2xx here — or no answer at all — tells the kubelet the process is wedged and has to be restarted, so it deliberately checks nothing a restart could not fix.',
  })
  @ApiOkResponse({ description: 'The process is alive; do not restart it.', type: HealthResponse })
  async live(): Promise<HealthResponse> {
    const result = await this.healthUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }

  @Get('ready')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Answer the Kubernetes readiness probe',
    description:
      'Returns the same verdict as `GET /health`. A non-2xx here takes the pod out of the service endpoints without restarting it, which is what should happen while a dependency is unreachable — the api has none yet, so for now this can only agree with liveness.',
  })
  @ApiOkResponse({ description: 'The process can be sent traffic.', type: HealthResponse })
  async ready(): Promise<HealthResponse> {
    const result = await this.healthUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }

  @Get('status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report who this process is',
    description:
      'The liveness verdict plus the build it came from, the time the process believes it is, and the id correlating this response with its request. Meant for a human diagnosing something, not for a probe.',
  })
  @ApiOkResponse({ description: 'The identity of the process that answered.', type: StatusResponse })
  async status(@RequestId() requestId: UUID): Promise<StatusResponse> {
    const result = await this.statusUseCase.execute({ requestId });

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }

  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @Header('Content-Type', 'text/plain; charset=utf-8')
  @ApiOperation({
    summary: 'Answer a liveness probe',
    description: 'Returns the literal string `pong`. Touches nothing, so it stays cheap enough for a per-second probe.',
  })
  @ApiProduces('text/plain')
  @ApiOkResponse({ description: 'The process is alive.', type: String, example: 'pong' })
  async ping(): Promise<string> {
    const result = await this.pingUseCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    return result.value;
  }
}
