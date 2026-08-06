import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { STUB_REQUEST_ID } from '../../constants/request.constants';
import { ApiStatus } from '../../enum/status.enum';
import type { EnvironmentVariables } from '../../plattform/environment/environment.interface';
import { EnvironmentService } from '../../plattform/environment/environment.service';
import { StatusUseCase } from './status.use-case';

/** A moment nothing else in the suite could have produced by accident. */
const NOW = new Date('2026-08-06T09:41:12.004Z');

/**
 * Resolved through Nest for the same reason {@link HealthUseCase}'s test is: the
 * `@Injectable` that makes the constructor resolvable is only exercised by
 * actually asking the container for the class.
 *
 * The identity comes from a fixture rather than the real environment, so an
 * implementation that quietly reverted to a literal fails here instead of
 * matching the api's own manifest by coincidence.
 */
async function buildUseCase(variables: Partial<EnvironmentVariables>): Promise<StatusUseCase> {
  const moduleReference = await Test.createTestingModule({
    providers: [
      StatusUseCase,
      { provide: EnvironmentService, useValue: new EnvironmentService(new ConfigService(variables)) },
    ],
  }).compile();

  return moduleReference.get(StatusUseCase);
}

describe('StatusUseCase', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  it('reports the identity, build and clock of the process that answered', async () => {
    const useCase = await buildUseCase({
      npm_package_name: '@minerva/queue-coordinator',
      npm_package_version: '2.4.1',
    });

    const result = await useCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    expect(result.value).toEqual({
      status: ApiStatus.Ok,
      name: 'queue-coordinator',
      version: '2.4.1',
      date: '2026-08-06T09:41:12.004Z',
      requestId: STUB_REQUEST_ID,
    });
  });

  it('falls back to the same identity the environment service does, rather than to one of its own', async () => {
    /* A `ConfigService` built over a partial record still reads through to
       `process.env` for whatever it does not hold, and `pnpm test` puts the real
       pair there. Clearing both is what makes this the absent case it claims to
       be rather than a reading of this very manifest. */
    vi.stubEnv('npm_package_name', undefined);
    vi.stubEnv('npm_package_version', undefined);

    const useCase = await buildUseCase({});

    const result = await useCase.execute();

    if (result.isFailure()) {
      throw result.error;
    }

    expect(result.value).toMatchObject({ name: 'api', version: '0.0.0' });
  });

  it('times the answer, not the boot -- two calls apart report being apart', async () => {
    const useCase = await buildUseCase({});

    const first = await useCase.execute();
    vi.setSystemTime(new Date(NOW.getTime() + 5_000));
    const second = await useCase.execute();

    if (first.isFailure() || second.isFailure()) {
      throw new Error('reporting the process identity cannot fail');
    }

    expect(second.value.date).not.toBe(first.value.date);
    expect(second.value.date).toBe('2026-08-06T09:41:17.004Z');
  });
});
