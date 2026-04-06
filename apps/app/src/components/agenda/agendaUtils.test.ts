import { describe, expect, it, vi } from 'vitest';

vi.mock('../../i18n/i18n', () => ({
  default: {
    t: (k: string) => {
      if (k === 'agenda.today') return 'Today';
      if (k === 'agenda.tomorrow') return 'Tomorrow';
      return k;
    },
    language: 'en',
  },
}));

import {
  addDays,
  AGENDA_DAY_END_HOUR,
  AGENDA_DAY_START_HOUR,
  entriesForDay,
  formatDayHeading,
  groupByDay,
  isSameLocalDay,
  localDateKey,
  startOfLocalDay,
  startOfWeekMonday,
  timelinePlacement,
} from './agendaUtils';

describe('agendaUtils', () => {
  describe('localDateKey', () => {
    it('formats YYYY-MM-DD in local calendar', () => {
      const d = new Date(2026, 3, 5, 15, 0, 0);
      expect(localDateKey(d)).toBe('2026-04-05');
    });
  });

  describe('groupByDay', () => {
    it('groups entries by local start date and sorts by time', () => {
      const map = groupByDay([
        {
          id: '2',
          title: 'B',
          start: '2026-04-05T14:00:00.000Z',
          end: '2026-04-05T15:00:00.000Z',
          status: 'x',
        },
        {
          id: '1',
          title: 'A',
          start: '2026-04-05T10:00:00.000Z',
          end: '2026-04-05T11:00:00.000Z',
          status: 'x',
        },
      ]);
      const keys = [...map.keys()];
      expect(keys.length).toBeGreaterThanOrEqual(1);
      const firstKey = keys[0];
      const list = map.get(firstKey)!;
      expect(list[0].id).toBe('1');
      expect(list[1].id).toBe('2');
    });
  });

  describe('timelinePlacement', () => {
    const day = new Date(2026, 3, 5, 0, 0, 0);

    it('returns null when event is outside the visible day window', () => {
      const start = new Date(2026, 3, 5, 5, 0, 0);
      const end = new Date(2026, 3, 5, 6, 0, 0);
      expect(timelinePlacement(start, end, day)).toBeNull();
    });

    it('computes top and height inside agenda hours', () => {
      const start = new Date(2026, 3, 5, AGENDA_DAY_START_HOUR, 0, 0);
      const end = new Date(2026, 3, 5, AGENDA_DAY_START_HOUR + 1, 0, 0);
      const p = timelinePlacement(start, end, day);
      expect(p).not.toBeNull();
      expect(p!.topPct).toBe(0);
      expect(p!.heightPct).toBeGreaterThan(0);
    });

    it('clips to AGENDA_DAY_END_HOUR', () => {
      const start = new Date(2026, 3, 5, AGENDA_DAY_END_HOUR - 1, 0, 0);
      const end = new Date(2026, 3, 5, AGENDA_DAY_END_HOUR + 2, 0, 0);
      const p = timelinePlacement(start, end, day);
      expect(p).not.toBeNull();
      expect(p!.heightPct).toBeGreaterThan(0);
    });
  });

  describe('entriesForDay', () => {
    it('filters entries whose start falls on the same local day', () => {
      const day = new Date(2026, 3, 5, 12, 0, 0);
      const sameDay = new Date(2026, 3, 5, 9, 0, 0);
      const nextDay = new Date(2026, 3, 6, 9, 0, 0);
      const list = entriesForDay(
        [
          {
            id: '1',
            title: 'x',
            start: sameDay.toISOString(),
            end: new Date(2026, 3, 5, 10, 0, 0).toISOString(),
            status: 'x',
          },
          {
            id: '2',
            title: 'y',
            start: nextDay.toISOString(),
            end: new Date(2026, 3, 6, 10, 0, 0).toISOString(),
            status: 'x',
          },
        ],
        day,
      );
      expect(list.map((e) => e.id)).toEqual(['1']);
    });
  });

  describe('startOfWeekMonday', () => {
    it('returns Monday when given a Wednesday', () => {
      const wed = new Date(2026, 3, 8);
      const mon = startOfWeekMonday(wed);
      expect(mon.getDay()).toBe(1);
      expect(mon.getDate()).toBe(6);
    });

    it('returns previous Monday when given Sunday', () => {
      const sun = new Date(2026, 3, 12);
      const mon = startOfWeekMonday(sun);
      expect(mon.getDay()).toBe(1);
      expect(mon.getDate()).toBe(6);
    });
  });

  describe('startOfLocalDay / addDays / isSameLocalDay', () => {
    it('startOfLocalDay clears time', () => {
      const d = new Date(2026, 5, 10, 22, 30, 0);
      const s = startOfLocalDay(d);
      expect(s.getHours()).toBe(0);
      expect(s.getMinutes()).toBe(0);
    });

    it('addDays moves calendar date', () => {
      const a = new Date(2026, 0, 31);
      const b = addDays(a, 1);
      expect(b.getMonth()).toBe(1);
      expect(b.getDate()).toBe(1);
    });

    it('isSameLocalDay compares calendar fields', () => {
      const a = new Date(2026, 2, 1, 8, 0);
      const b = new Date(2026, 2, 1, 20, 0);
      expect(isSameLocalDay(a, b)).toBe(true);
    });
  });

  describe('formatDayHeading', () => {
    it('returns Today for same calendar day as now', () => {
      const now = new Date(2026, 7, 10, 12, 0, 0);
      const d = new Date(2026, 7, 10, 8, 0, 0);
      expect(formatDayHeading(d, now)).toBe('Today');
    });

    it('returns Tomorrow for the day after now', () => {
      const now = new Date(2026, 7, 10, 12, 0, 0);
      const tomorrow = new Date(2026, 7, 11, 8, 0, 0);
      expect(formatDayHeading(tomorrow, now)).toBe('Tomorrow');
    });
  });
});
