export function computeSlots(input: {
  from: Date;
  to: Date;
  durationMinutes: number;
  bufferMinutes: number;
  booked: Array<{ startUtc: Date; endUtc: Date }>;
}) {
  const slots: Array<{ start: string; end: string }> = [];
  let cursor = new Date(input.from);
  const step = (input.durationMinutes + input.bufferMinutes) * 60_000;

  while (cursor.getTime() + input.durationMinutes * 60_000 <= input.to.getTime()) {
    const end = new Date(cursor.getTime() + input.durationMinutes * 60_000);
    const overlaps = input.booked.some((b) => cursor < b.endUtc && end > b.startUtc);
    if (!overlaps) {
      slots.push({ start: cursor.toISOString(), end: end.toISOString() });
    }
    cursor = new Date(cursor.getTime() + step);
  }

  return slots;
}
