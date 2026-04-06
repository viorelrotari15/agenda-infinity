import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PublicSpecialistController } from './public-specialist.controller';
import { PrismaService } from './prisma.service';

describe('PublicSpecialistController', () => {
  const prismaMock = {
    specialistProfile: {
      findUnique: jest.fn(),
    },
    service: {
      findMany: jest.fn(),
    },
  };

  let controller: PublicSpecialistController;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      controllers: [PublicSpecialistController],
      providers: [{ provide: PrismaService, useValue: prismaMock }],
    }).compile();
    controller = moduleRef.get(PublicSpecialistController);
  });

  it('returns HTML for existing specialist', async () => {
    prismaMock.specialistProfile.findUnique.mockResolvedValue({
      id: 'sp1',
      displayName: 'Dr. Demo',
      slug: 'dr-demo',
      publicBio: 'Hello world',
      seoTitle: null,
    });
    prismaMock.service.findMany.mockResolvedValue([{ name: 'Massage' }]);

    const html = await controller.specialistPage('dr-demo');
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Dr. Demo');
    expect(html).toContain('Massage');
    expect(html).toContain('meta name="description"');
  });

  it('throws NotFoundException when slug missing', async () => {
    prismaMock.specialistProfile.findUnique.mockResolvedValue(null);
    await expect(controller.specialistPage('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
