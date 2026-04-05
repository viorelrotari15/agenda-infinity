import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { BookingStatus } from '@prisma/client';
import * as admin from 'firebase-admin';
import { apiTLocale } from './i18n/api-messages';
import type { AppLocale } from './i18n/locale-context';
import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { PrismaService } from './prisma.service';
import { localDateKey, getZonedParts, safeTimezone } from './reminder-timezone';
import {
  bookingReminderTemplate,
  bookingTwoHourReminderTemplate,
  specialistMorningDigestTemplate,
} from './templates/notifications';

function localeToBcp47(locale: AppLocale): string {
  if (locale === 'ro') return 'ro-RO';
  if (locale === 'ru') return 'ru-RU';
  return 'en-US';
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Morning reminders: push + SMS (+ email when SMTP is set) for each user's bookings,
   * plus a daily digest for specialists. Uses each specialist's timezone and
   * MORNING_REMINDER_HOUR_LOCAL (default 8). Runs every 15 minutes; deduped with DB fields.
   */
  /**
   * ~2 hours before start: push + SMS + email for the client. Uses a time window around
   * TWO_HOUR_REMINDER_LEAD_MINUTES (default 120) and TWO_HOUR_REMINDER_WINDOW_MINUTES (default 10).
   */
  @Cron('*/5 * * * *')
  async handleTwoHourReminders(): Promise<void> {
    const now = new Date();
    const leadMin = Math.max(15, Number(process.env.TWO_HOUR_REMINDER_LEAD_MINUTES ?? '120'));
    const windowMin = Math.max(4, Number(process.env.TWO_HOUR_REMINDER_WINDOW_MINUTES ?? '10'));
    const halfWin = windowMin / 2;
    const minStart = new Date(now.getTime() + (leadMin - halfWin) * 60 * 1000);
    const maxStart = new Date(now.getTime() + (leadMin + halfWin) * 60 * 1000);

    try {
      const bookings = await this.prisma.booking.findMany({
        where: {
          status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
          startUtc: { gte: minStart, lte: maxStart },
          twoHourReminderSentAt: null,
        },
        include: {
          specialist: true,
          service: true,
          client: { select: { fcmToken: true, phone: true, email: true } },
        },
        take: 200,
        orderBy: { startUtc: 'asc' },
      });

      let sent = 0;
      for (const b of bookings) {
        const tz = safeTimezone(b.specialist.timezone);
        const startLabel = b.startUtc.toLocaleString('en-US', {
          timeZone: tz,
          dateStyle: 'medium',
          timeStyle: 'short',
        });
        const title = 'Starting in about 2 hours';
        const text = bookingTwoHourReminderTemplate(
          b.clientName,
          b.specialist.displayName,
          b.service.name,
          startLabel,
        );

        try {
          await Promise.allSettled([
            this.sendEmail(b.clientEmail, title, text),
            b.clientPhone ? this.sendSms(b.clientPhone, text) : Promise.resolve(),
            b.client?.fcmToken ? this.sendFcm(b.client.fcmToken, title, text) : Promise.resolve(),
          ]);
          await this.prisma.booking.update({
            where: { id: b.id },
            data: { twoHourReminderSentAt: now },
          });
          sent += 1;
        } catch (e) {
          this.logger.warn(`2h reminder failed for booking ${b.id}: ${e}`);
        }
      }

      if (sent > 0) {
        this.logger.log(`2-hour booking reminders sent: ${sent}`);
      }
    } catch (e) {
      this.logger.error(`2-hour reminders job failed: ${e}`);
    }
  }

  @Cron('*/15 * * * *')
  async handleMorningReminders(): Promise<void> {
    const reminderHour = Math.min(
      23,
      Math.max(0, Number(process.env.MORNING_REMINDER_HOUR_LOCAL ?? '8')),
    );
    const now = new Date();

    try {
      await this.remindClientsForTodayBookings(now, reminderHour);
    } catch (e) {
      this.logger.error(`Client morning reminders failed: ${e}`);
    }

    try {
      await this.sendSpecialistMorningDigests(now, reminderHour);
    } catch (e) {
      this.logger.error(`Specialist morning digests failed: ${e}`);
    }
  }

  private async remindClientsForTodayBookings(now: Date, reminderHour: number): Promise<void> {
    const bookings = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
        startUtc: { gte: now },
        morningReminderSentAt: null,
      },
      include: {
        specialist: true,
        service: true,
        client: { select: { fcmToken: true, phone: true, email: true } },
      },
      take: 500,
      orderBy: { startUtc: 'asc' },
    });

    let sent = 0;
    for (const b of bookings) {
      const tz = safeTimezone(b.specialist.timezone);
      const parts = getZonedParts(now, tz);
      if (parts.hour !== reminderHour) continue;

      const todayKey = localDateKey(now, tz);
      if (localDateKey(b.startUtc, tz) !== todayKey) continue;

      const startLabel = b.startUtc.toLocaleString('en-US', {
        timeZone: tz,
        dateStyle: 'medium',
        timeStyle: 'short',
      });
      const title = 'Reminder: appointment today';
      const text = bookingReminderTemplate(b.clientName, startLabel);

      try {
        await Promise.allSettled([
          this.sendEmail(b.clientEmail, title, text),
          b.clientPhone ? this.sendSms(b.clientPhone, text) : Promise.resolve(),
          b.client?.fcmToken ? this.sendFcm(b.client.fcmToken, title, text) : Promise.resolve(),
        ]);
        await this.prisma.booking.update({
          where: { id: b.id },
          data: { morningReminderSentAt: now },
        });
        sent += 1;
      } catch (e) {
        this.logger.warn(`Morning reminder failed for booking ${b.id}: ${e}`);
      }
    }

    if (sent > 0) {
      this.logger.log(`Morning client reminders sent: ${sent}`);
    }
  }

  private async sendSpecialistMorningDigests(now: Date, reminderHour: number): Promise<void> {
    const rows = await this.prisma.booking.findMany({
      where: {
        status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
        startUtc: { gte: now },
      },
      distinct: ['specialistId'],
      select: { specialistId: true },
    });

    const specialistIds = rows.map((r) => r.specialistId);
    if (!specialistIds.length) return;

    const specialists = await this.prisma.specialistProfile.findMany({
      where: { id: { in: specialistIds } },
      include: { user: { select: { fcmToken: true, phone: true, email: true } } },
    });

    for (const sp of specialists) {
      const tz = safeTimezone(sp.timezone);
      const parts = getZonedParts(now, tz);
      if (parts.hour !== reminderHour) continue;

      const todayKey = localDateKey(now, tz);
      if (sp.morningDigestSentForLocalDate === todayKey) continue;

      const dayBookings = await this.prisma.booking.findMany({
        where: {
          specialistId: sp.id,
          status: { in: [BookingStatus.CREATED, BookingStatus.ACCEPTED] },
          startUtc: { gte: now },
        },
        include: { service: true },
        orderBy: { startUtc: 'asc' },
      });

      const todays = dayBookings.filter((x) => localDateKey(x.startUtc, tz) === todayKey);

      await this.prisma.specialistProfile.update({
        where: { id: sp.id },
        data: { morningDigestSentForLocalDate: todayKey },
      });

      if (todays.length === 0) continue;

      const lines = todays.map((x) => {
        const t = x.startUtc.toLocaleString('en-US', {
          timeZone: tz,
          timeStyle: 'short',
        });
        return `${x.service.name} — ${x.clientName} @ ${t}`;
      });
      const body = specialistMorningDigestTemplate(sp.displayName, lines);
      const title = `Today: ${todays.length} session(s)`;
      const u = sp.user;

      await Promise.allSettled([
        u.fcmToken ? this.sendFcm(u.fcmToken, title, body) : Promise.resolve(),
        u.phone ? this.sendSms(u.phone, body) : Promise.resolve(),
        this.sendEmail(u.email, title, body),
      ]);

      this.logger.log(`Morning digest sent to specialist ${sp.id} (${todays.length} sessions)`);
    }
  }

  async notifyClientBookingDecision(params: {
    decision: 'accept' | 'deny';
    clientName: string;
    clientEmail: string;
    clientPhone: string | null;
    clientFcmToken: string | null;
    specialistDisplayName: string;
    serviceName: string;
    startUtc: Date;
    locale?: AppLocale;
  }): Promise<void> {
    const lang = params.locale ?? 'en';
    const startLabel = params.startUtc.toLocaleString(localeToBcp47(lang), {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
    const vars = {
      clientName: params.clientName,
      specialistName: params.specialistDisplayName,
      serviceName: params.serviceName,
      startLabel,
    };
    const title =
      params.decision === 'accept'
        ? apiTLocale(lang, 'notify_decision_accept_title')
        : apiTLocale(lang, 'notify_decision_deny_title');
    const bodyText =
      params.decision === 'accept'
        ? apiTLocale(lang, 'notify_decision_accept_body', vars)
        : apiTLocale(lang, 'notify_decision_deny_body', vars);

    const results = await Promise.allSettled([
      this.sendEmail(params.clientEmail, title, bodyText),
      params.clientPhone ? this.sendSms(params.clientPhone, bodyText) : Promise.resolve(),
      params.clientFcmToken
        ? this.sendFcm(params.clientFcmToken, title, bodyText)
        : Promise.resolve(),
    ]);

    for (const r of results) {
      if (r.status === 'rejected') {
        this.logger.warn(`Notification channel failed: ${r.reason}`);
      }
    }
  }

  private isGuestEmail(email: string) {
    return email.endsWith('@guest.local');
  }

  private async sendEmail(to: string, subject: string, text: string): Promise<void> {
    if (this.isGuestEmail(to)) {
      this.logger.log('Skipping email to guest placeholder address');
      return;
    }
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.SMTP_FROM ?? user;
    if (!host || !user || !pass || !from) {
      this.logger.log('SMTP not configured; email not sent');
      return;
    }
    const port = Number(process.env.SMTP_PORT ?? '587');
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
    await transporter.sendMail({ from, to, subject, text });
    this.logger.log(`Email sent to ${to}`);
  }

  private async sendSms(to: string, body: string): Promise<void> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    if (!sid || !token || !from) {
      this.logger.log('Twilio not configured; SMS not sent');
      return;
    }
    const client = twilio(sid, token);
    await client.messages.create({ from, to, body });
    this.logger.log(`SMS sent to ${to}`);
  }

  private ensureFirebaseApp(): admin.app.App | null {
    if (admin.apps.length) return admin.app();
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw?.trim()) return null;
    try {
      const cred = JSON.parse(raw) as admin.ServiceAccount;
      return admin.initializeApp({ credential: admin.credential.cert(cred) });
    } catch (e) {
      this.logger.warn(`Firebase init failed: ${e}`);
      return null;
    }
  }

  private async sendFcm(token: string, title: string, body: string): Promise<void> {
    const app = this.ensureFirebaseApp();
    if (!app) {
      this.logger.log('Firebase not configured; push not sent');
      return;
    }
    await admin.messaging(app).send({
      token,
      notification: { title, body },
    });
    this.logger.log('FCM notification sent');
  }
}
