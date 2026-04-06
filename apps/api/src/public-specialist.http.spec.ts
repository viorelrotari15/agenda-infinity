import { RequestMethod } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { INestApplication } from '@nestjs/common';
// supertest is CommonJS; avoid default import issues under ts-jest
// eslint-disable-next-line @typescript-eslint/no-require-imports
import request = require('supertest');
import { PublicSpecialistController } from './public-specialist.controller';
import { PrismaService } from './prisma.service';

describe('GET /p/:slug (HTTP)', () => {
  let app: INestApplication;
  const prismaMock = {
    specialistProfile: { findUnique: jest.fn() },
    service: { findMany: jest.fn() },
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicSpecialistController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api', {
      exclude: [{ path: 'p/:slug', method: RequestMethod.GET }],
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 200 text/html at /p/:slug (not under /api)', async () => {
    prismaMock.specialistProfile.findUnique.mockResolvedValue({
      id: 's1',
      displayName: 'Test',
      slug: 'test-slug',
      publicBio: null,
      seoTitle: null,
    });
    prismaMock.service.findMany.mockResolvedValue([{ name: 'A' }]);

    const res = await request(app.getHttpServer()).get('/p/test-slug');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('<title>');
  });

  it('returns 404 when slug unknown', async () => {
    prismaMock.specialistProfile.findUnique.mockResolvedValue(null);
    const res = await request(app.getHttpServer()).get('/p/missing');
    expect(res.status).toBe(404);
  });
});
