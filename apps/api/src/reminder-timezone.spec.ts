import {
  getZonedParts,
  localDateKey,
  localDateKeyFromParts,
  safeTimezone,
} from './reminder-timezone';

describe('reminder-timezone', () => {
  describe('getZonedParts', () => {
    it('returns calendar parts for a UTC instant in UTC', () => {
      const d = new Date('2026-06-15T12:30:00.000Z');
      const p = getZonedParts(d, 'UTC');
      expect(p.year).toBe(2026);
      expect(p.month).toBe(6);
      expect(p.day).toBe(15);
      expect(p.hour).toBe(12);
      expect(p.minute).toBe(30);
    });
  });

  describe('localDateKeyFromParts', () => {
    it('pads month and day', () => {
      expect(localDateKeyFromParts({ year: 2026, month: 3, day: 7, hour: 0, minute: 0 })).toBe(
        '2026-03-07',
      );
    });
  });

  describe('localDateKey', () => {
    it('matches parts composed key in UTC', () => {
      const d = new Date('2026-01-05T00:00:00.000Z');
      expect(localDateKey(d, 'UTC')).toBe('2026-01-05');
    });
  });

  describe('safeTimezone', () => {
    it('returns UTC for nullish input', () => {
      expect(safeTimezone(null)).toBe('UTC');
      expect(safeTimezone(undefined)).toBe('UTC');
    });

    it('returns trimmed zone when valid', () => {
      expect(safeTimezone('  Europe/Bucharest  ')).toBe('Europe/Bucharest');
    });

    it('falls back to UTC for invalid IANA id', () => {
      expect(safeTimezone('Not/AZone123')).toBe('UTC');
    });
  });
});
