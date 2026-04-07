import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { apiT } from '../../i18n/api-messages';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { hashPasswordSha256 } from '../../shared/security/hash-password';
import { assertPhoneMinLen8 } from '../../shared/phone/phone';

// keep BadRequestException import: used by phone assertion helper (throws it)

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  issueTokens(payload: { sub: string; role: Role }) {
    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '30d' });
    return { accessToken, refreshToken };
  }

  async registerClient(input: { email: string; password: string; phone: string }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new UnauthorizedException(apiT('email_already_exists'));
    }
    const phone = assertPhoneMinLen8(input.phone);

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        phone,
        password: hashPasswordSha256(input.password),
        role: 'CLIENT',
        clientProfile: { create: {} },
      },
    });

    return this.issueTokens({ sub: user.id, role: 'CLIENT' });
  }

  async registerSpecialist(input: {
    email: string;
    password: string;
    phone: string;
    displayName: string;
    slug: string;
    timezone?: string;
  }) {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new UnauthorizedException(apiT('email_already_exists'));
    }
    const phone = assertPhoneMinLen8(input.phone);

    const slugTaken = await this.prisma.specialistProfile.findUnique({
      where: { slug: input.slug },
    });
    if (slugTaken) {
      throw new BadRequestException(apiT('slug_taken'));
    }

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        phone,
        password: hashPasswordSha256(input.password),
        role: 'SPECIALIST',
        specialist: {
          create: {
            displayName: input.displayName,
            slug: input.slug,
            timezone: input.timezone ?? 'UTC',
          },
        },
      },
    });

    return this.issueTokens({ sub: user.id, role: 'SPECIALIST' });
  }

  async login(input: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || user.password !== hashPasswordSha256(input.password)) {
      throw new UnauthorizedException(apiT('invalid_credentials'));
    }

    return this.issueTokens({ sub: user.id, role: user.role });
  }

  async getUserFromToken(header?: string) {
    if (!header?.startsWith('Bearer ')) {
      throw new UnauthorizedException(apiT('missing_bearer_token'));
    }
    const token = header.slice('Bearer '.length);
    let payload: { sub: string; role: Role };
    try {
      payload = this.jwtService.verify<{ sub: string; role: Role }>(token);
    } catch {
      throw new UnauthorizedException(apiT('invalid_token'));
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) throw new UnauthorizedException(apiT('user_not_found'));
    return user;
  }

  /** Optional auth for public endpoints (returns null if missing/invalid token). */
  async tryGetUserFromToken(header?: string): Promise<User | null> {
    if (!header?.startsWith('Bearer ')) return null;
    const token = header.slice('Bearer '.length);
    let payload: { sub: string; role: Role };
    try {
      payload = this.jwtService.verify<{ sub: string; role: Role }>(token);
    } catch {
      return null;
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    return user ?? null;
  }
}
