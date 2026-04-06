import { describe, expect, it } from 'vitest';
import {
  BookingEventSchema,
  BookingStatusSchema,
  BannerPublicSchema,
  CreateBookingSchema,
  MeUserSchema,
  RoleSchema,
  ServiceDtoSchema,
  SpecialistPublicSchema,
  WorkingHoursRuleSchema,
} from './index';

describe('CreateBookingSchema', () => {
  it('accepts a minimal valid booking payload', () => {
    const parsed = CreateBookingSchema.parse({
      specialistId: 'sp_1',
      serviceId: 'svc_1',
      startUtc: '2026-04-05T10:00:00.000Z',
    });
    expect(parsed.specialistId).toBe('sp_1');
  });

  it('rejects invalid datetime', () => {
    expect(() =>
      CreateBookingSchema.parse({
        specialistId: 'sp_1',
        serviceId: 'svc_1',
        startUtc: 'not-a-date',
      }),
    ).toThrow();
  });
});

describe('ServiceDtoSchema', () => {
  it('parses a service row', () => {
    const s = ServiceDtoSchema.parse({
      id: '1',
      name: 'Cut',
      durationMinutes: 30,
      bufferMinutes: 5,
      active: true,
    });
    expect(s.bufferMinutes).toBe(5);
  });
});

describe('SpecialistPublicSchema', () => {
  it('requires slug and timezone', () => {
    const sp = SpecialistPublicSchema.parse({
      id: 'x',
      slug: 'jane',
      displayName: 'Jane',
      timezone: 'Europe/Chisinau',
    });
    expect(sp.slug).toBe('jane');
  });
});

describe('MeUserSchema', () => {
  it('accepts client role without specialist profile', () => {
    const me = MeUserSchema.parse({
      id: 'u1',
      email: 'a@b.co',
      role: 'CLIENT',
    });
    expect(me.role).toBe('CLIENT');
  });
});

describe('RoleSchema & BookingStatusSchema', () => {
  it('parses known roles', () => {
    expect(RoleSchema.parse('ADMIN')).toBe('ADMIN');
    expect(RoleSchema.parse('SPECIALIST')).toBe('SPECIALIST');
  });

  it('parses booking statuses', () => {
    expect(BookingStatusSchema.parse('ACCEPTED')).toBe('ACCEPTED');
  });
});

describe('BookingEventSchema', () => {
  it('parses a calendar event row', () => {
    const e = BookingEventSchema.parse({
      id: 'b1',
      title: 'Cut',
      start: '2026-04-05T10:00:00.000Z',
      end: '2026-04-05T11:00:00.000Z',
      status: 'CREATED',
      serviceName: 'Cut',
      clientName: 'Ann',
      clientEmail: 'a@b.co',
    });
    expect(e.status).toBe('CREATED');
  });
});

describe('WorkingHoursRuleSchema', () => {
  it('requires dayOfWeek 0–6', () => {
    const r = WorkingHoursRuleSchema.parse({
      dayOfWeek: 1,
      startLocal: '09:00',
      endLocal: '17:00',
    });
    expect(r.dayOfWeek).toBe(1);
  });

  it('rejects invalid weekday', () => {
    expect(() =>
      WorkingHoursRuleSchema.parse({ dayOfWeek: 8, startLocal: '09:00', endLocal: '17:00' }),
    ).toThrow();
  });
});

describe('BannerPublicSchema', () => {
  it('parses banner payload', () => {
    const b = BannerPublicSchema.parse({
      id: '1',
      imageUrl: 'https://x/y.png',
      title: 'Promo',
      subtitle: null,
      linkUrl: null,
      sortOrder: 0,
    });
    expect(b.title).toBe('Promo');
  });
});
