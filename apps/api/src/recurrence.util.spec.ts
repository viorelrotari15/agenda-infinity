import { expandRecurrence } from './recurrence.util';

describe('expandRecurrence', () => {
  it('expands a daily rule within the window', () => {
    const from = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
    const to = new Date(Date.UTC(2026, 0, 5, 23, 59, 59));
    const dates = expandRecurrence('FREQ=DAILY;COUNT=3;DTSTART=20260101T000000Z', from, to);
    expect(dates.length).toBe(3);
    expect(dates[0].getUTCDate()).toBe(1);
    expect(dates[1].getUTCDate()).toBe(2);
    expect(dates[2].getUTCDate()).toBe(3);
  });

  it('returns empty when the window does not intersect rule occurrences', () => {
    const from = new Date(Date.UTC(2030, 5, 1, 0, 0, 0));
    const to = new Date(Date.UTC(2030, 5, 2, 0, 0, 0));
    const dates = expandRecurrence('FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=1;COUNT=10;DTSTART=20200101T000000Z', from, to);
    expect(dates).toEqual([]);
  });
});
