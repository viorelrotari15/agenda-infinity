import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Put,
} from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { apiT } from '../../i18n/api-messages';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Controller('client')
export class ClientInterestsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  @Get('interests')
  async getInterests(@Headers('authorization') authorization: string | undefined) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'CLIENT') throw new ForbiddenException(apiT('client_role_required'));
    await this.prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });
    const rows = await this.prisma.clientInterest.findMany({
      where: { userId: user.id },
      select: { categoryId: true },
    });
    return { categoryIds: rows.map((r) => r.categoryId) };
  }

  @Put('interests')
  async setInterests(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { categoryIds: string[] },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'CLIENT') throw new ForbiddenException(apiT('client_role_required'));
    const ids = Array.isArray(body.categoryIds) ? body.categoryIds : [];
    if (ids.length > 50) throw new BadRequestException(apiT('interests_too_many'));

    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids }, active: true },
      select: { id: true },
    });
    if (categories.length !== ids.length) {
      throw new BadRequestException(apiT('category_invalid'));
    }

    await this.prisma.clientProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    await this.prisma.$transaction([
      this.prisma.clientInterest.deleteMany({ where: { userId: user.id } }),
      this.prisma.clientInterest.createMany({
        data: ids.map((categoryId) => ({ userId: user.id, categoryId })),
      }),
    ]);

    return { categoryIds: ids };
  }
}
