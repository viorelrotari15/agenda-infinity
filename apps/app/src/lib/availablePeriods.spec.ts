import { describe, expect, it } from 'vitest';
import {
  availabilityQueryRange,
  capSlots,
  formatSlotDisplayLines,
  sortSlotsByStartAsc,
} from './availablePeriods';

describe('sortSlotsByStartAsc', () => {
  it('orders by start time ascending (soonest first)', () => {
    const sorted = sortSlotsByStartAsc([
      { start: '2026-04-10T10:00:00.000Z', end: '2026-04-10T10:30:00.000Z' },
      { start: '2026-04-09T10:00:00.000Z', end: '2026-04-09T10:30:00.000Z' },
      { start: '2026-04-09T14:00:00.000Z', end: '2026-04-09T14:30:00.000Z' },
    ]);
    expect(sorted.map((s) => s.start)).toEqual([
      '2026-04-09T10:00:00.000Z',
      '2026-04-09T14:00:00.000Z',
      '2026-04-10T10:00:00.000Z',
    ]);
  });
});

describe('capSlots', () => {
  it('returns all when under cap', () => {
    const slots = [{ start: 'a', end: 'b' }];
    expect(capSlots(slots, 5)).toEqual(slots);
  });

  it('truncates when over cap', () => {
    const slots = Array.from({ length: 10 }, (_, i) => ({
      start: `2026-01-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`,
      end: `2026-01-${String(i + 1).padStart(2, '0')}T10:30:00.000Z`,
    }));
    expect(capSlots(slots, 3)).toHaveLength(3);
  });
});

describe('formatSlotDisplayLines', () => {
  it('returns non-empty structured lines', () => {
    const lines = formatSlotDisplayLines(
      { start: '2026-06-15T14:00:00.000Z', end: '2026-06-15T14:30:00.000Z' },
      'en-US',
    );
    expect(lines.weekday.length).toBeGreaterThan(0);
    expect(lines.dateLine).toMatch(/2026/);
    expect(lines.timeLine).toMatch(/–/);
  });
});

describe('availabilityQueryRange', () => {
  it('has to after from', () => {
    const { from, to } = availabilityQueryRange(14);
    expect(new Date(to).getTime()).toBeGreaterThan(new Date(from).getTime());
  });
});
