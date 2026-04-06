import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { BookingStatus } from '@prisma/client';
import { RRule } from 'rrule';
import { addMinutes, endOfDay, set } from 'date-fns';
import { AuthService } from './auth.service';
import { apiT } from './i18n/api-messages';
import { getLocale } from './i18n/locale-context';
import { NotificationsService } from './notifications.service';
import { PrismaService } from './prisma.service';

function parseIso(value?: string) {
  if (!value) throw new BadRequestException(apiT('missing_date'));
  const date = new Date(value);
  if (Number.isNaN(date.getTime()))
    throw new BadRequestException(apiT('invalid_date', { value: String(value) }));
  return date;
}

@Controller()
export class AppController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auth: AuthService,
    private readonly notifications: NotificationsService,
  ) {}

  @Post('auth/register')
  registerClient(@Body() body: { email: string; password: string; phone: string }) {
    return this.auth.registerClient(body);
  }

  @Post('auth/register/specialist')
  registerSpecialist(
    @Body()
    body: {
      email: string;
      password: string;
      phone: string;
      displayName: string;
      slug: string;
      timezone?: string;
    },
  ) {
    return this.auth.registerSpecialist(body);
  }

  @Post('auth/login')
  login(@Body() body: { email: string; password: string }) {
    return this.auth.login(body);
  }

  @Post('auth/refresh')
  refresh(@Body() body: { refreshToken: string }) {
    const authHeader = `Bearer ${body.refreshToken}`;
    return this.auth
      .getUserFromToken(authHeader)
      .then((user) => this.auth.issueTokens({ sub: user.id, role: user.role }));
  }

  @Get('auth/me')
  async me(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUserFromToken(authorization);
    const base = { id: user.id, email: user.email, phone: user.phone, role: user.role };
    if (user.role !== 'SPECIALIST') return base;
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        displayName: true,
        slug: true,
        timezone: true,
        publicBio: true,
        seoTitle: true,
      },
    });
    return { ...base, specialistProfile: specialist };
  }

  @Patch('auth/profile')
  async patchProfile(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      phone?: string;
      fcmToken?: string | null;
      publicBio?: string | null;
      seoTitle?: string | null;
    },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    const data: { phone?: string | null; fcmToken?: string | null } = {};
    if (body.phone !== undefined) {
      const trimmed = body.phone.trim().replace(/\s+/g, '');
      if (trimmed.length > 0 && trimmed.length < 8) {
        throw new BadRequestException(apiT('phone_must_8'));
      }
      data.phone = trimmed.length ? trimmed : null;
    }
    if (body.fcmToken !== undefined) {
      const t = typeof body.fcmToken === 'string' ? body.fcmToken.trim() : '';
      data.fcmToken = t.length ? t : null;
    }
    if (Object.keys(data).length) {
      await this.prisma.user.update({ where: { id: user.id }, data });
    }

    if (user.role === 'SPECIALIST') {
      const spData: { publicBio?: string | null; seoTitle?: string | null } = {};
      if (body.publicBio !== undefined) {
        const t = typeof body.publicBio === 'string' ? body.publicBio.trim() : '';
        if (t.length > 8000) throw new BadRequestException(apiT('public_bio_too_long'));
        spData.publicBio = t.length ? t : null;
      }
      if (body.seoTitle !== undefined) {
        const t = typeof body.seoTitle === 'string' ? body.seoTitle.trim() : '';
        if (t.length > 200) throw new BadRequestException(apiT('seo_title_too_long'));
        spData.seoTitle = t.length ? t : null;
      }
      if (Object.keys(spData).length) {
        await this.prisma.specialistProfile.update({
          where: { userId: user.id },
          data: spData,
        });
      }
    }

    return this.me(authorization);
  }

  @Get('banners')
  listBannersPublic() {
    return this.prisma.banner.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }],
      select: {
        id: true,
        imageUrl: true,
        title: true,
        subtitle: true,
        linkUrl: true,
        sortOrder: true,
      },
    });
  }

  @Get('specialists')
  listSpecialists() {
    return this.prisma.specialistProfile.findMany({
      select: { id: true, slug: true, displayName: true, timezone: true },
      orderBy: { displayName: 'asc' },
    });
  }

  @Get('specialists/by-slug/:slug')
  async bySlug(@Param('slug') slug: string) {
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        displayName: true,
        timezone: true,
        publicBio: true,
        seoTitle: true,
      },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_not_found'));
    return specialist;
  }

  @Get('specialists/:id/services')
  services(@Param('id') id: string) {
    return this.prisma.service.findMany({
      where: { specialistId: id, active: true },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        bufferMinutes: true,
        active: true,
        serviceTypeId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  @Get('specialists/:id/working-hours')
  specialistWorkingHoursPublic(@Param('id') specialistId: string) {
    return this.prisma.workingHoursRule.findMany({
      where: { specialistId },
      select: { dayOfWeek: true, startLocal: true, endLocal: true },
      orderBy: [{ dayOfWeek: 'asc' }, { startLocal: 'asc' }],
    });
  }

  @Get('specialists/:id/availability')
  async availability(
    @Param('id') specialistId: string,
    @Query('serviceId') serviceId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = parseIso(from);
    const toDate = parseIso(to);

    const [service, rules, booked, blocks] = await Promise.all([
      this.prisma.service.findFirst({ where: { id: serviceId, specialistId, active: true } }),
      this.prisma.workingHoursRule.findMany({ where: { specialistId } }),
      this.prisma.booking.findMany({
        where: {
          specialistId,
          status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        select: { startUtc: true, endUtc: true },
      }),
      this.prisma.availabilityBlock.findMany({
        where: {
          specialistId,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        select: { startUtc: true, endUtc: true },
      }),
    ]);

    const busy = [
      ...booked.map((b: { startUtc: Date; endUtc: Date }) => ({
        startUtc: b.startUtc,
        endUtc: b.endUtc,
      })),
      ...blocks.map((b: { startUtc: Date; endUtc: Date }) => ({
        startUtc: b.startUtc,
        endUtc: b.endUtc,
      })),
    ];

    if (!service) throw new BadRequestException(apiT('service_not_found'));
    if (!rules.length) return [];

    const slots: Array<{ start: string; end: string }> = [];
    for (let d = new Date(fromDate); d <= toDate; d = addMinutes(endOfDay(d), 1)) {
      const rule = rules.find((r: { dayOfWeek: number }) => r.dayOfWeek === d.getUTCDay());
      if (!rule) continue;

      const [startHour, startMinute] = rule.startLocal.split(':').map(Number);
      const [endHour, endMinute] = rule.endLocal.split(':').map(Number);
      let cursor = set(new Date(d), {
        hours: startHour,
        minutes: startMinute,
        seconds: 0,
        milliseconds: 0,
      });
      const dayEnd = set(new Date(d), {
        hours: endHour,
        minutes: endMinute,
        seconds: 0,
        milliseconds: 0,
      });

      while (addMinutes(cursor, service.durationMinutes) <= dayEnd) {
        const slotEnd = addMinutes(cursor, service.durationMinutes);
        const overlaps = busy.some(
          (b: { startUtc: Date; endUtc: Date }) => cursor < b.endUtc && slotEnd > b.startUtc,
        );
        if (!overlaps && cursor >= fromDate && slotEnd <= toDate) {
          slots.push({ start: cursor.toISOString(), end: slotEnd.toISOString() });
        }
        cursor = addMinutes(cursor, service.durationMinutes + service.bufferMinutes);
      }
    }

    return slots;
  }

  @Get('specialists/:id/occupied')
  async occupied(
    @Param('id') specialistId: string,
    @Query('from') from: string,
    @Query('to') to: string,
  ) {
    const fromDate = parseIso(from);
    const toDate = parseIso(to);

    const [booked, blocks] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          specialistId,
          status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        select: { startUtc: true, endUtc: true },
        orderBy: { startUtc: 'asc' },
      }),
      this.prisma.availabilityBlock.findMany({
        where: {
          specialistId,
          startUtc: { lt: toDate },
          endUtc: { gt: fromDate },
        },
        select: { startUtc: true, endUtc: true },
        orderBy: { startUtc: 'asc' },
      }),
    ]);

    const merged = [...booked, ...blocks].sort(
      (a, b) => a.startUtc.getTime() - b.startUtc.getTime(),
    );
    return merged.map((b) => ({
      start: b.startUtc.toISOString(),
      end: b.endUtc.toISOString(),
    }));
  }

  @Post('bookings')
  async createBooking(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: {
      specialistId: string;
      serviceId: string;
      startUtc: string;
      clientName?: string;
      clientEmail?: string;
      clientPhone?: string;
      recurrence?: { rrule: string; untilUtc?: string };
    },
  ) {
    let clientUserId: string | undefined;
    try {
      if (authorization?.startsWith('Bearer ')) {
        const u = await this.auth.getUserFromToken(authorization);
        if (u.role === 'CLIENT') clientUserId = u.id;
      }
    } catch {
      /* guest or invalid token */
    }

    const service = await this.prisma.service.findUnique({ where: { id: body.serviceId } });
    if (!service) throw new BadRequestException(apiT('service_not_found'));

    const firstStart = parseIso(body.startUtc);
    const firstEnd = addMinutes(firstStart, service.durationMinutes);
    const hasOverlap = async (start: Date, end: Date) => {
      const [overlapBooking, overlapBlock] = await Promise.all([
        this.prisma.booking.findFirst({
          where: {
            specialistId: body.specialistId,
            status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
            startUtc: { lt: end },
            endUtc: { gt: start },
          },
          select: { id: true },
        }),
        this.prisma.availabilityBlock.findFirst({
          where: {
            specialistId: body.specialistId,
            startUtc: { lt: end },
            endUtc: { gt: start },
          },
          select: { id: true },
        }),
      ]);
      return Boolean(overlapBooking || overlapBlock);
    };

    const createOne = (start: Date, end: Date, recurrenceSeriesId?: string) =>
      this.prisma.booking.create({
        data: {
          specialistId: body.specialistId,
          serviceId: body.serviceId,
          clientUserId,
          clientName: body.clientName ?? body.clientPhone ?? 'Guest',
          clientEmail:
            body.clientEmail ?? `${(body.clientPhone ?? 'guest').replace(/\s+/g, '')}@guest.local`,
          clientPhone: body.clientPhone,
          startUtc: start,
          endUtc: end,
          status: BookingStatus.CREATED,
          recurrenceSeriesId,
          recurrenceRrule: body.recurrence?.rrule,
        },
      });

    if (!body.recurrence?.rrule) {
      if (await hasOverlap(firstStart, firstEnd)) {
        throw new BadRequestException(apiT('slot_occupied'));
      }
      const created = await createOne(firstStart, firstEnd);
      return { id: created.id };
    }

    const seriesId = `series_${Date.now()}`;
    const rule = RRule.fromString(body.recurrence.rrule);
    const until = body.recurrence.untilUtc
      ? parseIso(body.recurrence.untilUtc)
      : addMinutes(firstStart, 60 * 24 * 30);
    const occurrences = rule.between(firstStart, until, true);
    if (!occurrences.length) throw new BadRequestException(apiT('no_recurrence_occurrences'));
    const occurrenceRanges = occurrences.map((occurrence) => ({
      start: occurrence,
      end: addMinutes(occurrence, service.durationMinutes),
    }));
    for (const range of occurrenceRanges) {
      if (await hasOverlap(range.start, range.end)) {
        throw new BadRequestException(apiT('recurrence_slots_occupied'));
      }
    }

    const created = await this.prisma.$transaction(
      occurrenceRanges.map((range) => createOne(range.start, range.end, seriesId)),
    );

    return { id: created[0].id, seriesId, total: created.length };
  }

  @Get('specialist/bookings')
  async specialistBookings(
    @Headers('authorization') authorization?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const fromDate = from ? parseIso(from) : new Date(0);
    const toDate = to ? parseIso(to) : new Date('2999-12-31T00:00:00.000Z');

    const bookings = await this.prisma.booking.findMany({
      where: {
        specialistId: specialist.id,
        startUtc: { gte: fromDate },
        endUtc: { lte: toDate },
      },
      include: { service: true },
      orderBy: { startUtc: 'asc' },
    });

    return bookings.map(
      (b: {
        id: string;
        startUtc: Date;
        endUtc: Date;
        status: string;
        clientName: string;
        clientEmail: string;
        clientPhone: string | null;
        recurrenceSeriesId: string | null;
        service: { name: string };
      }) => ({
        id: b.id,
        title: `${b.service.name} - ${b.clientName}`,
        start: b.startUtc.toISOString(),
        end: b.endUtc.toISOString(),
        status: b.status,
        serviceName: b.service.name,
        clientName: b.clientName,
        clientEmail: b.clientEmail,
        clientPhone: b.clientPhone,
        recurrenceSeriesId: b.recurrenceSeriesId,
      }),
    );
  }

  @Get('specialist/bookings/:id')
  async specialistBookingById(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const booking = await this.prisma.booking.findFirst({
      where: { id, specialistId: specialist.id },
      include: { service: true },
    });
    if (!booking) throw new BadRequestException(apiT('booking_not_found'));

    return {
      id: booking.id,
      title: `${booking.service.name} - ${booking.clientName}`,
      start: booking.startUtc.toISOString(),
      end: booking.endUtc.toISOString(),
      status: booking.status,
      serviceName: booking.service.name,
      serviceId: booking.serviceId,
      durationMinutes: booking.service.durationMinutes,
      clientName: booking.clientName,
      clientEmail: booking.clientEmail,
      clientPhone: booking.clientPhone,
      recurrenceSeriesId: booking.recurrenceSeriesId,
    };
  }

  @Patch('specialist/bookings/:id/decision')
  async specialistBookingDecision(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Body() body: { decision: 'accept' | 'deny' },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    if (body.decision !== 'accept' && body.decision !== 'deny') {
      throw new BadRequestException(apiT('decision_invalid'));
    }

    const booking = await this.prisma.booking.findFirst({
      where: { id, specialistId: specialist.id },
      include: { service: true, specialist: true },
    });
    if (!booking) throw new BadRequestException(apiT('booking_not_found'));
    if (booking.status !== BookingStatus.CREATED) {
      throw new BadRequestException(apiT('booking_decision_pending_only'));
    }

    const nextStatus = body.decision === 'accept' ? BookingStatus.ACCEPTED : BookingStatus.DENIED;

    const updated = await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: nextStatus },
      include: { service: true, specialist: true },
    });

    let clientFcmToken: string | null = null;
    if (booking.clientUserId) {
      const u = await this.prisma.user.findUnique({
        where: { id: booking.clientUserId },
        select: { fcmToken: true },
      });
      clientFcmToken = u?.fcmToken ?? null;
    }

    void this.notifications.notifyClientBookingDecision({
      decision: body.decision,
      clientName: updated.clientName,
      clientEmail: updated.clientEmail,
      clientPhone: updated.clientPhone,
      clientFcmToken,
      specialistDisplayName: updated.specialist.displayName,
      serviceName: updated.service.name,
      startUtc: updated.startUtc,
      locale: getLocale(),
    });

    return { id: updated.id, status: updated.status };
  }

  @Get('client/bookings')
  async clientBookings(
    @Headers('authorization') authorization?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'CLIENT') throw new BadRequestException(apiT('client_role_required'));

    const fromDate = from ? parseIso(from) : new Date(0);
    const toDate = to ? parseIso(to) : new Date('2999-12-31T00:00:00.000Z');

    const bookings = await this.prisma.booking.findMany({
      where: {
        clientUserId: user.id,
        startUtc: { gte: fromDate },
        endUtc: { lte: toDate },
      },
      include: { service: true, specialist: true },
      orderBy: { startUtc: 'asc' },
    });

    return bookings.map((b) => ({
      id: b.id,
      title: `${b.service.name} · ${b.specialist.displayName}`,
      start: b.startUtc.toISOString(),
      end: b.endUtc.toISOString(),
      status: b.status,
      serviceName: b.service.name,
      specialistName: b.specialist.displayName,
      recurrenceSeriesId: b.recurrenceSeriesId,
    }));
  }

  @Get('specialist/working-hours')
  async getWorkingHours(@Headers('authorization') authorization?: string) {
    const user = await this.auth.getUserFromToken(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    return this.prisma.workingHoursRule.findMany({
      where: { specialistId: specialist.id },
      select: { dayOfWeek: true, startLocal: true, endLocal: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Put('specialist/working-hours')
  async setWorkingHours(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: { rules: Array<{ dayOfWeek: number; startLocal: string; endLocal: string }> },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    await this.prisma.$transaction([
      this.prisma.workingHoursRule.deleteMany({ where: { specialistId: specialist.id } }),
      this.prisma.workingHoursRule.createMany({
        data: body.rules.map((r) => ({ specialistId: specialist.id, ...r })),
      }),
    ]);

    return this.prisma.workingHoursRule.findMany({
      where: { specialistId: specialist.id },
      select: { dayOfWeek: true, startLocal: true, endLocal: true },
      orderBy: { dayOfWeek: 'asc' },
    });
  }

  @Get('specialist/services')
  async listMyServices(@Headers('authorization') authorization: string | undefined) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));
    return this.prisma.service.findMany({
      where: { specialistId: specialist.id },
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        bufferMinutes: true,
        active: true,
        serviceTypeId: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  @Post('specialist/services')
  async createService(
    @Headers('authorization') authorization: string | undefined,
    @Body()
    body: { name: string; durationMinutes: number; bufferMinutes?: number; serviceTypeId?: string },
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    return this.prisma.service.create({
      data: {
        specialistId: specialist.id,
        name: body.name,
        durationMinutes: body.durationMinutes,
        bufferMinutes: body.bufferMinutes ?? 0,
        serviceTypeId: body.serviceTypeId,
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

  @Patch('specialist/services/:serviceId')
  async patchSpecialistService(
    @Headers('authorization') authorization: string | undefined,
    @Param('serviceId') serviceId: string,
    @Body()
    body: Partial<{
      name: string;
      durationMinutes: number;
      bufferMinutes: number;
      active: boolean;
    }>,
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const existing = await this.prisma.service.findFirst({
      where: { id: serviceId, specialistId: specialist.id },
      select: { id: true },
    });
    if (!existing) throw new BadRequestException(apiT('service_not_found'));

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

  @Delete('bookings/:id')
  async cancelBooking(
    @Headers('authorization') authorization: string | undefined,
    @Param('id') id: string,
    @Query('scope') scope?: 'this' | 'series',
  ) {
    const user = await this.auth.getUserFromToken(authorization);
    if (user.role !== 'SPECIALIST') throw new BadRequestException(apiT('specialist_role_required'));

    const specialist = await this.prisma.specialistProfile.findUnique({
      where: { userId: user.id },
    });
    if (!specialist) throw new BadRequestException(apiT('specialist_profile_not_found'));

    const booking = await this.prisma.booking.findFirst({
      where: { id, specialistId: specialist.id },
    });
    if (!booking) throw new BadRequestException(apiT('booking_not_found'));

    if (scope === 'series' && booking.recurrenceSeriesId) {
      const updated = await this.prisma.booking.updateMany({
        where: { recurrenceSeriesId: booking.recurrenceSeriesId, specialistId: specialist.id },
        data: { status: BookingStatus.CANCELLED },
      });
      return { cancelled: updated.count, scope: 'series' };
    }

    await this.prisma.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED },
    });
    return { cancelled: 1, scope: 'this' };
  }
}
