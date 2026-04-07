import type { Slot } from '@agenda/shared';

function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

/** How many calendar days ahead to request from the public availability API. */
export const AVAILABILITY_LOOKAHEAD_DAYS = 14;

/** Max rows to render in compact lists (full data still sorted). */
export const DEFAULT_AVAILABLE_PERIODS_CAP = 40;

export function sortSlotsByStartAsc<T extends { start: string }>(slots: T[]): T[] {
  return [...slots].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
}

export type SlotDisplayLines = {
  weekday: string;
  dateLine: string;
  timeLine: string;
};

/**
 * Human-readable lines for a bookable slot in the user's locale.
 * Uses the runtime default time zone (same as the booking calendar UI).
 */
export function formatSlotDisplayLines(
  slot: { start: string; end: string },
  locale: string,
): SlotDisplayLines {
  const start = new Date(slot.start);
  const end = new Date(slot.end);
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const dateFmt = new Intl.DateTimeFormat(locale, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  return {
    weekday: weekdayFmt.format(start),
    dateLine: dateFmt.format(start),
    timeLine: `${timeFmt.format(start)} – ${timeFmt.format(end)}`,
  };
}

export function availabilityQueryRange(daysAhead: number): { from: string; to: string } {
  const from = startOfLocalDay(new Date());
  const lastDay = addDays(from, daysAhead);
  const to = new Date(lastDay);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

export function capSlots<T extends Slot>(slots: T[], max: number): T[] {
  if (slots.length <= max) return slots;
  return slots.slice(0, max);
}
