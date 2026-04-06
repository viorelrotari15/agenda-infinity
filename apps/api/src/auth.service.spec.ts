import { createHash } from 'node:crypto';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';

function hashPassword(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

describe('AuthService', () => {
  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    specialistProfile: {
      findUnique: jest.fn(),
    },
  };

  const jwtMock = {
    sign: jest.fn().mockReturnValue('signed.jwt.token'),
    verify: jest.fn(),
  };

  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('issueTokens', () => {
    it('returns access and refresh tokens from JwtService', () => {
      jwtMock.sign.mockReturnValueOnce('access').mockReturnValueOnce('refresh');
      const out = service.issueTokens({ sub: 'user-1', role: 'CLIENT' });
      expect(out).toEqual({ accessToken: 'access', refreshToken: 'refresh' });
      expect(jwtMock.sign).toHaveBeenCalledTimes(2);
    });
  });

  describe('registerClient', () => {
    it('throws when email already exists', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'x' });
      await expect(
        service.registerClient({ email: 'a@b.co', password: 'pw', phone: '+12345678' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws when phone is too short', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(
        service.registerClient({ email: 'a@b.co', password: 'pw', phone: '123' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates user and returns tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'new-u',
        email: 'a@b.co',
        phone: '+12345678',
        password: hashPassword('secret'),
        role: 'CLIENT' as Role,
      });
      jwtMock.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      const out = await service.registerClient({
        email: 'a@b.co',
        password: 'secret',
        phone: '+12345678',
      });

      expect(out).toEqual({ accessToken: 'at', refreshToken: 'rt' });
      expect(prismaMock.user.create).toHaveBeenCalled();
    });
  });

  describe('registerSpecialist', () => {
    it('throws when slug is taken', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.specialistProfile.findUnique.mockResolvedValue({ id: 'sp' });
      await expect(
        service.registerSpecialist({
          email: 'a@b.co',
          password: 'pw',
          phone: '+12345678',
          displayName: 'Doc',
          slug: 'doc',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates specialist and returns tokens', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.specialistProfile.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'sp-u',
        email: 'sp@b.co',
        phone: '+12345678',
        password: hashPassword('pw'),
        role: 'SPECIALIST' as Role,
      });
      jwtMock.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');

      const out = await service.registerSpecialist({
        email: 'sp@b.co',
        password: 'pw',
        phone: '+12345678',
        displayName: 'Dr',
        slug: 'dr-x',
        timezone: 'Europe/Bucharest',
      });

      expect(out).toEqual({ accessToken: 'at', refreshToken: 'rt' });
      expect(prismaMock.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('throws when user missing', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.login({ email: 'a@b.co', password: 'pw' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when password does not match', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        password: hashPassword('other'),
        role: 'CLIENT' as Role,
      });
      await expect(service.login({ email: 'a@b.co', password: 'pw' })).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns tokens on valid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        password: hashPassword('good'),
        role: 'CLIENT' as Role,
      });
      jwtMock.sign.mockReturnValueOnce('at').mockReturnValueOnce('rt');
      const out = await service.login({ email: 'a@b.co', password: 'good' });
      expect(out).toEqual({ accessToken: 'at', refreshToken: 'rt' });
    });
  });

  describe('getUserFromToken', () => {
    it('throws when header is missing', async () => {
      await expect(service.getUserFromToken(undefined)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when header does not start with Bearer', async () => {
      await expect(service.getUserFromToken('Basic x')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when JWT verify fails', async () => {
      jwtMock.verify.mockImplementation(() => {
        throw new Error('bad');
      });
      await expect(service.getUserFromToken('Bearer bad.token')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('throws when user no longer exists', async () => {
      jwtMock.verify.mockReturnValue({ sub: 'gone', role: 'CLIENT' });
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.getUserFromToken('Bearer valid.jwt')).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });

    it('returns user when token and DB row are valid', async () => {
      jwtMock.verify.mockReturnValue({ sub: 'u1', role: 'CLIENT' });
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'a@b.co',
        phone: null,
        role: 'CLIENT' as Role,
      });
      const user = await service.getUserFromToken('Bearer valid.jwt');
      expect(user.id).toBe('u1');
    });
  });
});
