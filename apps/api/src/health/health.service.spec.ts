import type { PrismaRoService } from '../database/prisma-ro.service';
import type { PrismaRwService } from '../database/prisma-rw.service';
import type { S3Service } from '../storage/s3.service';
import type { ValkeyService } from '../valkey/valkey.service';
import { HealthService } from './health.service';

function buildService(overrides: { rwFails?: boolean; valkeyUp?: boolean } = {}) {
  const query = (fails: boolean) =>
    fails ? vi.fn().mockRejectedValue(new Error('down')) : vi.fn().mockResolvedValue([{ '?column?': 1 }]);
  const prismaRw = { $queryRaw: query(overrides.rwFails ?? false) } as unknown as PrismaRwService;
  const prismaRo = { $queryRaw: query(false) } as unknown as PrismaRoService;
  const valkey = { isHealthy: vi.fn().mockResolvedValue(overrides.valkeyUp ?? true) } as unknown as ValkeyService;
  const s3 = { isHealthy: vi.fn().mockResolvedValue(true) } as unknown as S3Service;
  return new HealthService(prismaRw, prismaRo, valkey, s3);
}

describe('HealthService', () => {
  it('reports ok when every dependency is up', async () => {
    const result = await buildService().check('1.0.0');

    expect(result.status).toBe('ok');
    expect(result.version).toBe('1.0.0');
    expect(result.services).toEqual({ databaseRead: 'up', databaseWrite: 'up', valkey: 'up', s3: 'up' });
  });

  it('reports degraded when a dependency is down', async () => {
    const result = await buildService({ rwFails: true, valkeyUp: false }).check('1.0.0');

    expect(result.status).toBe('degraded');
    expect(result.services.databaseWrite).toBe('down');
    expect(result.services.valkey).toBe('down');
    expect(result.services.databaseRead).toBe('up');
  });
});
