const STORAGE_KEY = 'agenda-guest-specialist-views';

export type GuestViewEntry = { id: string; at: number };

export function readGuestViewHistory(): GuestViewEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (x): x is GuestViewEntry =>
          typeof x === 'object' &&
          x !== null &&
          'id' in x &&
          typeof (x as GuestViewEntry).id === 'string' &&
          'at' in x &&
          typeof (x as GuestViewEntry).at === 'number',
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}

/** Most recently viewed first (for ranking boost). */
export function getGuestViewIdOrder(): string[] {
  return readGuestViewHistory()
    .sort((a, b) => b.at - a.at)
    .map((e) => e.id);
}

export function recordSpecialistView(specialistId: string): void {
  if (typeof window === 'undefined' || !specialistId) return;
  const prev = readGuestViewHistory().filter((e) => e.id !== specialistId);
  const next: GuestViewEntry[] = [{ id: specialistId, at: Date.now() }, ...prev].slice(0, 30);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}
