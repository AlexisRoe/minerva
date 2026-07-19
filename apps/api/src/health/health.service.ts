import type { HealthResponse, ServiceStatus } from '@minerva/shared';
import { Injectable } from '@nestjs/common';
import { PrismaRoService } from '../database/prisma-ro.service';
import { PrismaRwService } from '../database/prisma-rw.service';
import { S3Service } from '../storage/s3.service';
import { ValkeyService } from '../valkey/valkey.service';

@Injectable()
export class HealthService {
  constructor(
    private readonly prismaRw: PrismaRwService,
    private readonly prismaRo: PrismaRoService,
    private readonly valkey: ValkeyService,
    private readonly s3: S3Service,
  ) {}

  async check(version: string): Promise<HealthResponse> {
    const [databaseWrite, databaseRead, valkey, s3] = await Promise.all([
      this.probe(() => this.prismaRw.$queryRaw`SELECT 1`),
      this.probe(() => this.prismaRo.$queryRaw`SELECT 1`),
      this.valkey.isHealthy().then((up): ServiceStatus => (up ? 'up' : 'down')),
      this.s3.isHealthy().then((up): ServiceStatus => (up ? 'up' : 'down')),
    ]);

    const services = { databaseRead, databaseWrite, valkey, s3 };
    const status = Object.values(services).every((service) => service === 'up') ? 'ok' : 'degraded';
    return { status, version, services };
  }

  private async probe(query: () => Promise<unknown>): Promise<ServiceStatus> {
    try {
      await query();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
