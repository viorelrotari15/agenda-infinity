import { describe, expect, it } from 'vitest';
import { isWithinWorkingHours, slotTimeRange } from './bookingCalendarUtils';

describe('slotTimeRange', () => {
  it('uses defaults when there are no rules', () => {
    expect(slotTimeRange([])).toEqual({
      slotMinTime: '08:00:00',
      slotMaxTime: '20:00:00',
    });
  });

  it('computes min/max from rules', () => {
    const r = slotTimeRange([
      { dayOfWeek: 1, startLocal: '09:00', endLocal: '12:00' },
      { dayOfWeek: 1, startLocal: '14:00', endLocal: '18:30' },
    ]);
    expect(r.slotMinTime).toBe('09:00:00');
    expect(r.slotMaxTime).toBe('18:30:00');
  });
});

describe('isWithinWorkingHours', () => {
  const monday = [
    { dayOfWeek: 1, startLocal: '09:00', endLocal: '17:00' },
  ];

  it('returns false when there are no rules', () => {
    const start = new Date('2026-04-06T10:00:00');
    const end = new Date('2026-04-06T11:00:00');
    expect(isWithinWorkingHours(start, end, [])).toBe(false);
  });

  it('returns true when the interval lies inside a rule for that weekday', () => {
    const start = new Date('2026-04-06T10:00:00');
    const end = new Date('2026-04-06T11:00:00');
    expect(isWithinWorkingHours(start, end, monday)).toBe(true);
  });

  it('returns false when the slot spills past closing', () => {
    const start = new Date('2026-04-06T16:00:00');
    const end = new Date('2026-04-06T18:00:00');
    expect(isWithinWorkingHours(start, end, monday)).toBe(false);
  });

  it('returns false when start and end are on different calendar days', () => {
    const start = new Date('2026-04-06T23:00:00');
    const end = new Date('2026-04-07T01:00:00');
    expect(isWithinWorkingHours(start, end, monday)).toBe(false);
  });
});
