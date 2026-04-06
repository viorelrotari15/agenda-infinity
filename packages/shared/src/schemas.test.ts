import { describe, expect, it } from 'vitest';
import {
  CreateBookingSchema,
  MeUserSchema,
  ServiceDtoSchema,
  SpecialistPublicSchema,
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
