import type { WorkingHoursRule } from '@agenda/shared';

function parseLocalHM(s: string): { h: number; m: number } {
  const [h = 0, m = 0] = s.split(':').map((x) => Number(x) || 0);
  return { h, m };
}

function ruleBoundsMinutes(rule: WorkingHoursRule): { start: number; end: number } {
  const a = parseLocalHM(rule.startLocal);
  const b = parseLocalHM(rule.endLocal);
  return { start: a.h * 60 + a.m, end: b.h * 60 + b.m };
}

export function slotTimeRange(rules: WorkingHoursRule[]): {
  slotMinTime: string;
  slotMaxTime: string;
} {
  if (!rules.length) {
    return { slotMinTime: '08:00:00', slotMaxTime: '20:00:00' };
  }
  let minS = Infinity;
  let maxE = -Infinity;
  for (const r of rules) {
    const { start, end } = ruleBoundsMinutes(r);
    minS = Math.min(minS, start);
    maxE = Math.max(maxE, end);
  }
  const fmt = (total: number) => {
    const h = Math.floor(total / 60);
    const m = Math.round(total % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
  };
  return { slotMinTime: fmt(minS), slotMaxTime: fmt(maxE) };
}

function minutesOfDay(d: Date): number {
  return d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60;
}

export function isWithinWorkingHours(start: Date, end: Date, rules: WorkingHoursRule[]): boolean {
  if (!rules.length) return false;
  if (start.getDay() !== end.getDay()) return false;
  if (end <= start) return false;
  const day = start.getDay();
  const dayRules = rules.filter((r) => r.dayOfWeek === day);
  if (!dayRules.length) return false;
  const sm = minutesOfDay(start);
  const em = minutesOfDay(end);
  return dayRules.some((r) => {
    const { start: rs, end: re } = ruleBoundsMinutes(r);
    return sm >= rs && em <= re;
  });
}

export function toBusinessHours(rules: WorkingHoursRule[]) {
  return rules.map((r) => {
    const s = parseLocalHM(r.startLocal);
    const e = parseLocalHM(r.endLocal);
    return {
      daysOfWeek: [r.dayOfWeek],
      startTime: `${String(s.h).padStart(2, '0')}:${String(s.m).padStart(2, '0')}:00`,
      endTime: `${String(e.h).padStart(2, '0')}:${String(e.m).padStart(2, '0')}:00`,
    };
  });
}

/** Minutes from midnight for the union of working intervals on this weekday (local). */
export function dayWorkingMinutesRange(
  rules: WorkingHoursRule[],
  day: Date,
): { startMin: number; endMin: number } | null {
  const dayRules = rules.filter((r) => r.dayOfWeek === day.getDay());
  if (!dayRules.length) return null;
  let minS = Infinity;
  let maxE = -Infinity;
  for (const r of dayRules) {
    const { start, end } = ruleBoundsMinutes(r);
    minS = Math.min(minS, start);
    maxE = Math.max(maxE, end);
  }
  return { startMin: minS, endMin: maxE };
}

export function bookingTimelinePlacement(
  start: Date,
  end: Date,
  day: Date,
  range: { startMin: number; endMin: number },
): { topPct: number; heightPct: number } | null {
  const day0 = new Date(day);
  day0.setHours(0, 0, 0, 0);
  const windowStartMs = day0.getTime() + range.startMin * 60000;
  const windowEndMs = day0.getTime() + range.endMin * 60000;
  const totalMin = range.endMin - range.startMin;
  if (totalMin <= 0) return null;
  const s = Math.max(start.getTime(), windowStartMs);
  const e = Math.min(end.getTime(), windowEndMs);
  if (e <= s) return null;
  const topMin = (s - windowStartMs) / 60000;
  const durMin = (e - s) / 60000;
  return {
    topPct: (topMin / totalMin) * 100,
    heightPct: Math.max((durMin / totalMin) * 100, 1.2),
  };
}
