import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';

import { ApiStatus } from '../../enum/status.enum';
import type { EnvironmentVariables } from '../../plattform/environment/environment.interface';
import { EnvironmentService } from '../../plattform/environment/environment.service';
import { RootUseCase } from './health-root.use-case';

/**
 * Resolved through Nest rather than with `new`, because half of what is worth
 * asserting here is the wiring: a `RootUseCase` that lost its `@Injectable`
 * carries no `design:paramtypes`, and fails to resolve at exactly this point and
 * nowhere earlier.
 *
 * The `EnvironmentService` is built over a fixed configuration instead of the
 * real `EnvironmentModule`, so the name under test is one this test chose --
 * asserting against the api's own name would pass just as well if the use case
 * had gone back to a literal.
 */
async function buildUseCase(variables: Partial<EnvironmentVariables>): Promise<RootUseCase> {
  const moduleReference = await Test.createTestingModule({
    providers: [
      RootUseCase,
      { provide: EnvironmentService, useValue: new EnvironmentService(new ConfigService(variables)) },
    ],
  }).compile();

  return moduleReference.get(RootUseCase);
}

describe('RootUseCase', () => {
  it('answers with the name of the package that started the process, not a literal', async () => {
    const useCase = await buildUseCase({ npm_package_name: '@minerva/queue-coordinator' });

    const result = await useCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    expect(result.value).toEqual({ status: ApiStatus.Ok, name: 'queue-coordinator' });
  });

  it('reports ok, since it has nothing to probe that could say otherwise', async () => {
    const useCase = await buildUseCase({ npm_package_name: '@minerva/api' });

    const result = await useCase.execute();

    if (!result.isSuccess()) {
      throw new Error('the liveness verdict cannot itself fail');
    }

    expect(result.value.status).toBe(ApiStatus.Ok);
  });
});
