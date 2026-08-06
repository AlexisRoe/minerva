import { Controller, Get, Header, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ApiDocumentationTags } from '../../enum/api-documentation.enum';
import { RootResponse } from '../dto/root.response';
import { RootUseCase } from '../use-case/health-root.use-case';
import { PingUseCase } from '../use-case/ping.use-case';

@ApiTags(ApiDocumentationTags.Health)
@Controller('health')
export class HealthController {
  constructor(
    private readonly pingUseCase: PingUseCase,
    private readonly rootUseCase: RootUseCase,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Report the liveness verdict',
    description:
      'Returns what this process knows about itself. It probes no database, queue or downstream service, so `ok` means the api is up and routing works — nothing more.',
  })
  @ApiOkResponse({ description: 'The process can serve traffic.', type: RootResponse })
  async root(): Promise<RootResponse> {
    const result = await this.rootUseCase.execute();

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
