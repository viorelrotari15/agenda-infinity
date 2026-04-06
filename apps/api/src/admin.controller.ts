import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';
import { apiT } from './i18n/api-messages';
import { PrismaService } from './prisma.service';

function hashPassword(input: string) {
  return createHash('sha256').update(input).digest('hex');
}

@Controller('admin')
export class AdminController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
  ) {}

  private async requireAdmin(authorization?: string) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'ADMIN') throw new ForbiddenException(apiT('admin_access_required'));
    return user;
  }

  @Get('users')
  async listUsers(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true,
        specialist: { select: { id: true, displayName: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('users')
  async createUser(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      email: string;
      password: string;
      phone?: string;
      role: 'ADMIN' | 'SPECIALIST' | 'CLIENT';
      displayName?: string;
      slug?: string;
      timezone?: string;
    },
  ) {
    await this.requireAdmin(authorization);
    const existing = await this.prisma.user.findUnique({ where: { email: body.email } });
    if (existing) throw new BadRequestException(apiT('email_already_exists'));

    if (body.role === 'SPECIALIST') {
      if (!body.displayName || !body.slug) {
        throw new BadRequestException(apiT('displayname_slug_required_specialist'));
      }
      const slugTaken = await this.prisma.specialistProfile.findUnique({
        where: { slug: body.slug },
      });
      if (slugTaken) throw new BadRequestException(apiT('slug_taken'));
      const user = await this.prisma.user.create({
        data: {
          email: body.email,
          phone: body.phone?.trim() || null,
          password: hashPassword(body.password),
          role: 'SPECIALIST',
          specialist: {
            create: {
              displayName: body.displayName,
              slug: body.slug,
              timezone: body.timezone ?? 'UTC',
            },
          },
        },
        select: { id: true, email: true, phone: true, role: true },
      });
      return user;
    }

    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        phone: body.phone?.trim() || null,
        password: hashPassword(body.password),
        role: body.role,
      },
      select: { id: true, email: true, phone: true, role: true },
    });
    return user;
  }

  @Get('specialists')
  async listSpecialistsAdmin(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.prisma.specialistProfile.findMany({
      include: {
        user: { select: { id: true, email: true, phone: true } },
      },
      orderBy: { displayName: 'asc' },
    });
  }

  @Patch('specialists/:specialistId/public-profile')
  async patchSpecialistPublicProfile(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
    @Body() body: { publicBio?: string | null; seoTitle?: string | null },
  ) {
    await this.requireAdmin(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));
    const data: { publicBio?: string | null; seoTitle?: string | null } = {};
    if (body.publicBio !== undefined) {
      const t = typeof body.publicBio === 'string' ? body.publicBio.trim() : '';
      if (t.length > 8000) throw new BadRequestException(apiT('public_bio_too_long'));
      data.publicBio = t.length ? t : null;
    }
    if (body.seoTitle !== undefined) {
      const t = typeof body.seoTitle === 'string' ? body.seoTitle.trim() : '';
      if (t.length > 200) throw new BadRequestException(apiT('seo_title_too_long'));
      data.seoTitle = t.length ? t : null;
    }
    if (!Object.keys(data).length) {
      return this.prisma.specialistProfile.findUniqueOrThrow({
        where: { id: specialistId },
        select: {
          id: true,
          displayName: true,
          slug: true,
          timezone: true,
          publicBio: true,
          seoTitle: true,
        },
      });
    }
    return this.prisma.specialistProfile.update({
      where: { id: specialistId },
      data,
      select: {
        id: true,
        displayName: true,
        slug: true,
        timezone: true,
        publicBio: true,
        seoTitle: true,
      },
    });
  }

  @Put('specialists/:specialistId/working-hours')
  async setWorkingHoursAdmin(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
    @Body() body: { rules: Array<{ dayOfWeek: number; startLocal: string; endLocal: string }> },
  ) {
    await this.requireAdmin(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));

    await this.prisma.$transaction([
      this.prisma.workingHoursRule.deleteMany({ where: { specialistId } }),
      this.prisma.workingHoursRule.createMany({
        data: body.rules.map((r) => ({ specialistId, ...r })),
      }),
    ]);

    return this.prisma.workingHoursRule.findMany({
      where: { specialistId },
      select: { dayOfWeek: true, startLocal: true, endLocal: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Get('specialists/:specialistId/availability-blocks')
  async listBlocks(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
  ) {
    await this.requireAdmin(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));
    return this.prisma.availabilityBlock.findMany({
      where: { specialistId },
      orderBy: { startUtc: 'asc' },
    });
  }

  @Post('specialists/:specialistId/availability-blocks')
  async createBlock(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
    @Body() body: { startUtc: string; endUtc: string; note?: string },
  ) {
    await this.requireAdmin(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));
    const start = new Date(body.startUtc);
    const end = new Date(body.endUtc);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      throw new BadRequestException(apiT('invalid_time_range'));
    }
    return this.prisma.availabilityBlock.create({
      data: { specialistId, startUtc: start, endUtc: end, note: body.note },
    });
  }

  @Delete('availability-blocks/:id')
  async deleteBlock(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await this.requireAdmin(authorization);
    await this.prisma.availabilityBlock.delete({ where: { id } }).catch(() => {
      throw new BadRequestException(apiT('block_not_found'));
    });
    return { ok: true };
  }

  @Get('service-types')
  async listServiceTypes(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.prisma.serviceType.findMany({ orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  }

  @Post('service-types')
  async createServiceType(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      name: string;
      defaultDurationMinutes: number;
      defaultBufferMinutes?: number;
      sortOrder?: number;
    },
  ) {
    await this.requireAdmin(authorization);
    return this.prisma.serviceType.create({
      data: {
        name: body.name,
        defaultDurationMinutes: body.defaultDurationMinutes,
        defaultBufferMinutes: body.defaultBufferMinutes ?? 0,
        sortOrder: body.sortOrder ?? 0,
      },
    });
  }

  @Put('service-types/:id')
  async updateServiceType(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      name: string;
      defaultDurationMinutes: number;
      defaultBufferMinutes: number;
      active: boolean;
      sortOrder: number;
    }>,
  ) {
    await this.requireAdmin(authorization);
    return this.prisma.serviceType.update({
      where: { id },
      data: body,
    });
  }

  @Delete('service-types/:id')
  async deleteServiceType(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await this.requireAdmin(authorization);
    await this.prisma.service.updateMany({
      where: { serviceTypeId: id },
      data: { serviceTypeId: null },
    });
    await this.prisma.serviceType.delete({ where: { id } }).catch(() => {
      throw new BadRequestException(apiT('service_type_not_found'));
    });
    return { ok: true };
  }

  @Get('banners')
  async listBannersAdmin(@Headers('authorization') authorization?: string) {
    await this.requireAdmin(authorization);
    return this.prisma.banner.findMany({ orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }] });
  }

  @Post('banners')
  async createBanner(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      imageUrl: string;
      title: string;
      subtitle?: string;
      linkUrl?: string;
      sortOrder?: number;
      active?: boolean;
    },
  ) {
    await this.requireAdmin(authorization);
    return this.prisma.banner.create({
      data: {
        imageUrl: body.imageUrl,
        title: body.title,
        subtitle: body.subtitle,
        linkUrl: body.linkUrl,
        sortOrder: body.sortOrder ?? 0,
        active: body.active ?? true,
      },
    });
  }

  @Put('banners/:id')
  async updateBanner(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body()
    body: Partial<{
      imageUrl: string;
      title: string;
      subtitle: string | null;
      linkUrl: string | null;
      sortOrder: number;
      active: boolean;
    }>,
  ) {
    await this.requireAdmin(authorization);
    return this.prisma.banner.update({ where: { id }, data: body });
  }

  @Delete('banners/:id')
  async deleteBanner(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    await this.requireAdmin(authorization);
    await this.prisma.banner.delete({ where: { id } });
    return { ok: true };
  }

  @Post('specialists/:specialistId/services')
  async createServiceForSpecialist(
    @Headers('authorization') authorization: string | undefined,
    @Param('specialistId') specialistId: string,
    @Body()
    body: {
      name: string;
      durationMinutes: number;
      bufferMinutes?: number;
      serviceTypeId?: string;
      active?: boolean;
    },
  ) {
    await this.requireAdmin(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { id: specialistId },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));
    return this.prisma.service.create({
      data: {
        specialistId,
        name: body.name,
        durationMinutes: body.durationMinutes,
        bufferMinutes: body.bufferMinutes ?? 0,
        serviceTypeId: body.serviceTypeId,
        active: body.active ?? true,
      },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        bufferMinutes: true,
        active: true,
        serviceTypeId: true,
      },
    });
  }

  @Put('services/:serviceId')
  async updateService(
    @Headers('authorization') authorization: string | undefined,
    @Param('serviceId') serviceId: string,
    @Body()
    body: Partial<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
      active: boolean;
      serviceTypeId: string | null;
    }>,
  ) {
    await this.requireAdmin(authorization);
    return this.prisma.service.update({
      where: { id: serviceId },
      data: body,
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        bufferMinutes: true,
        active: true,
        serviceTypeId: true,
      },
    });
  }
}
