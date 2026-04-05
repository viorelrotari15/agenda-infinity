import i18n from '../../i18n/i18n';

export const AGENDA_DAY_START_HOUR = 7;
export const AGENDA_DAY_END_HOUR = 21;

export function startOfLocalDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export type AgendaEntry = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
  subtitle?: string;
};

export function localDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function groupByDay(entries: AgendaEntry[]): Map<string, AgendaEntry[]> {
  const map = new Map<string, AgendaEntry[]>();
  const sorted = [...entries].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );
  for (const e of sorted) {
    const key = localDateKey(new Date(e.start));
    const list = map.get(key) ?? [];
    list.push(e);
    map.set(key, list);
  }
  return map;
}

export function formatDayHeading(d: Date, now = new Date()): string {
  if (isSameLocalDay(d, now)) return i18n.t('agenda.today');
  const tomorrow = addDays(startOfLocalDay(now), 1);
  if (isSameLocalDay(d, tomorrow)) return i18n.t('agenda.tomorrow');
  return new Intl.DateTimeFormat(i18n.language || undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function timelinePlacement(
  start: Date,
  end: Date,
  day: Date,
): { topPct: number; heightPct: number } | null {
  const day0 = new Date(day);
  day0.setHours(AGENDA_DAY_START_HOUR, 0, 0, 0);
  const day1 = new Date(day);
  day1.setHours(AGENDA_DAY_END_HOUR, 0, 0, 0);
  const totalMin = (AGENDA_DAY_END_HOUR - AGENDA_DAY_START_HOUR) * 60;
  const s = Math.max(start.getTime(), day0.getTime());
  const e = Math.min(end.getTime(), day1.getTime());
  if (e <= s) return null;
  const topMin = (s - day0.getTime()) / 60000;
  const durMin = (e - s) / 60000;
  return {
    topPct: (topMin / totalMin) * 100,
    heightPct: Math.max((durMin / totalMin) * 100, 1.2),
  };
}

export function entriesForDay(entries: AgendaEntry[], day: Date): AgendaEntry[] {
  return entries.filter((e) => isSameLocalDay(new Date(e.start), day));
}

export function startOfWeekMonday(d: Date): Date {
  const x = startOfLocalDay(d);
  const dow = x.getDay();
  const diff = dow === 0 ? -6 : 1 - dow;
  return addDays(x, diff);
}
