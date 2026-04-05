/** Calendar parts for a Date in an IANA timezone (e.g. Europe/Bucharest). */
export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
};

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const d = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(d.find((x) => x.type === type)?.value ?? 0);

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}

export function localDateKeyFromParts(p: ZonedParts): string {
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

export function localDateKey(date: Date, timeZone: string): string {
  return localDateKeyFromParts(getZonedParts(date, timeZone));
}

/** Valid IANA zone or UTC if invalid. */
export function safeTimezone(tz: string | null | undefined): string {
  const t = (tz ?? 'UTC').trim() || 'UTC';
  try {
    Intl.DateTimeFormat(undefined, { timeZone: t }).format(new Date());
    return t;
  } catch {
    return 'UTC';
  }
}
