import { computeSlots } from './availability.util';

describe('computeSlots', () => {
  it('returns non-overlapping slots for an empty day window', () => {
    const from = new Date('2026-04-05T09:00:00.000Z');
    const to = new Date('2026-04-05T11:00:00.000Z');
    const slots = computeSlots({
      from,
      to,
      durationMinutes: 30,
      bufferMinutes: 0,
      booked: [],
    });
    expect(slots).toEqual([
      { start: '2026-04-05T09:00:00.000Z', end: '2026-04-05T09:30:00.000Z' },
      { start: '2026-04-05T09:30:00.000Z', end: '2026-04-05T10:00:00.000Z' },
      { start: '2026-04-05T10:00:00.000Z', end: '2026-04-05T10:30:00.000Z' },
      { start: '2026-04-05T10:30:00.000Z', end: '2026-04-05T11:00:00.000Z' },
    ]);
  });

  it('skips slots that overlap booked ranges', () => {
    const from = new Date('2026-04-05T09:00:00.000Z');
    const to = new Date('2026-04-05T11:00:00.000Z');
    const slots = computeSlots({
      from,
      to,
      durationMinutes: 30,
      bufferMinutes: 0,
      booked: [
        {
          startUtc: new Date('2026-04-05T09:15:00.000Z'),
          endUtc: new Date('2026-04-05T09:45:00.000Z'),
        },
      ],
    });
    const starts = slots.map((s) => s.start);
    expect(starts).not.toContain('2026-04-05T09:00:00.000Z');
    expect(starts).not.toContain('2026-04-05T09:30:00.000Z');
    expect(starts).toContain('2026-04-05T10:00:00.000Z');
  });

  it('steps by duration plus buffer', () => {
    const from = new Date('2026-04-05T09:00:00.000Z');
    const to = new Date('2026-04-05T10:30:00.000Z');
    const slots = computeSlots({
      from,
      to,
      durationMinutes: 30,
      bufferMinutes: 15,
      booked: [],
    });
    expect(slots.map((s) => s.start)).toEqual([
      '2026-04-05T09:00:00.000Z',
      '2026-04-05T09:45:00.000Z',
    ]);
  });
});
