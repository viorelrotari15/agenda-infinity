import { describe, expect, it } from 'vitest';
import {
  bookingTimelinePlacement,
  dayWorkingMinutesRange,
  isWithinWorkingHours,
  slotTimeRange,
  toBusinessHours,
} from './bookingCalendarUtils';

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
  const monday = [{ dayOfWeek: 1, startLocal: '09:00', endLocal: '17:00' }];

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

describe('toBusinessHours', () => {
  it('maps rules to FullCalendar-style segments', () => {
    const out = toBusinessHours([{ dayOfWeek: 2, startLocal: '09:30', endLocal: '17:00' }]);
    expect(out).toHaveLength(1);
    expect(out[0].daysOfWeek).toEqual([2]);
    expect(out[0].startTime).toBe('09:30:00');
    expect(out[0].endTime).toBe('17:00:00');
  });
});

describe('dayWorkingMinutesRange', () => {
  const rules = [
    { dayOfWeek: 3, startLocal: '10:00', endLocal: '12:00' },
    { dayOfWeek: 3, startLocal: '14:00', endLocal: '18:00' },
  ];

  it('returns union min/max minutes for that weekday', () => {
    const day = new Date(2026, 3, 8);
    expect(day.getDay()).toBe(3);
    const r = dayWorkingMinutesRange(rules, day);
    expect(r).toEqual({ startMin: 10 * 60, endMin: 18 * 60 });
  });

  it('returns null when no rules for weekday', () => {
    const day = new Date(2026, 3, 6);
    expect(dayWorkingMinutesRange(rules, day)).toBeNull();
  });
});

describe('bookingTimelinePlacement', () => {
  const day = new Date(2026, 3, 5, 0, 0, 0);
  const range = { startMin: 9 * 60, endMin: 17 * 60 };

  it('returns null when total window is non-positive', () => {
    expect(
      bookingTimelinePlacement(
        new Date(2026, 3, 5, 10, 0, 0),
        new Date(2026, 3, 5, 11, 0, 0),
        day,
        { startMin: 100, endMin: 100 },
      ),
    ).toBeNull();
  });

  it('places an event inside the working window', () => {
    const start = new Date(2026, 3, 5, 10, 0, 0);
    const end = new Date(2026, 3, 5, 11, 0, 0);
    const p = bookingTimelinePlacement(start, end, day, range);
    expect(p).not.toBeNull();
    expect(p!.topPct).toBeGreaterThanOrEqual(0);
    expect(p!.heightPct).toBeGreaterThan(0);
  });

  it('returns null when event is entirely outside window', () => {
    const start = new Date(2026, 3, 5, 7, 0, 0);
    const end = new Date(2026, 3, 5, 8, 0, 0);
    expect(bookingTimelinePlacement(start, end, day, range)).toBeNull();
  });
});
