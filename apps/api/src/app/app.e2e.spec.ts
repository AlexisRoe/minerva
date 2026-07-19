import type { INestApplication } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { PrismaRoService } from '../database/prisma-ro.service';
import { PrismaRwService } from '../database/prisma-rw.service';
import { S3Service } from '../storage/s3.service';
import { ValkeyService } from '../valkey/valkey.service';
import { AppModule } from './app.module';

describe('API (e2e, infrastructure mocked)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const prismaStub = {
      $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
      eventLog: { create: vi.fn().mockResolvedValue({}) },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaRwService)
      .useValue(prismaStub)
      .overrideProvider(PrismaRoService)
      .useValue(prismaStub)
      .overrideProvider(ValkeyService)
      .useValue({ publish: vi.fn().mockResolvedValue('7-0'), isHealthy: vi.fn().mockResolvedValue(true) })
      .overrideProvider(S3Service)
      .useValue({ isHealthy: vi.fn().mockResolvedValue(true) })
      .compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health reports every service up', async () => {
    const response = await request(app.getHttpServer()).get('/health').expect(200);

    expect(response.body.status).toBe('ok');
    expect(response.body.services).toEqual({ databaseRead: 'up', databaseWrite: 'up', valkey: 'up', s3: 'up' });
  });

  it('POST /events/hello publishes an event', async () => {
    const response = await request(app.getHttpServer())
      .post('/events/hello')
      .send({ message: 'hello e2e' })
      .expect(201);

    expect(response.body).toEqual({ eventId: '7-0' });
  });

  it('POST /events/hello rejects unknown fields', async () => {
    await request(app.getHttpServer()).post('/events/hello').send({ message: 'x', extra: 'nope' }).expect(400);
  });

  it('POST /images/sign rejects non-https urls', async () => {
    await request(app.getHttpServer()).post('/images/sign').send({ url: 'http://insecure.example/x.png' }).expect(400);
  });

  it('POST /images/sign returns a signed proxy url', async () => {
    const response = await request(app.getHttpServer())
      .post('/images/sign')
      .send({ url: 'https://example.com/cat.png' })
      .expect(201);

    expect(response.body.proxyUrl).toMatch(/^http:\/\/localhost:8443\/[0-9a-f]{40}\/[0-9a-f]+$/u);
  });
});
