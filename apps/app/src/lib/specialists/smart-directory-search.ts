import type { SpecialistDirectoryEntry } from '@agenda/shared';

/** Lowercase ASCII-ish form for tolerant matching (strips common Latin diacritics). */
export function normalizeForDirectorySearch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function haystackForEntry(entry: SpecialistDirectoryEntry): string {
  const parts = [
    entry.displayName,
    entry.publicBio ?? '',
    entry.seoTitle ?? '',
    ...entry.categories.map((c) => c.name),
    ...entry.sampleServices.map((sv) => sv.name),
  ];
  return normalizeForDirectorySearch(parts.join(' '));
}

/**
 * Filters directory entries by a free-text query across name, categories, sample services, and bio.
 * Multiple words must all match somewhere (AND across tokens).
 */
export function filterSpecialistsBySmartSearch(
  entries: SpecialistDirectoryEntry[],
  rawQuery: string,
): SpecialistDirectoryEntry[] {
  const q = rawQuery.trim();
  if (!q) return entries;

  const tokens = q
    .split(/\s+/)
    .map((t) => normalizeForDirectorySearch(t))
    .filter(Boolean);
  if (tokens.length === 0) return entries;

  return entries.filter((entry) => {
    const hay = haystackForEntry(entry);
    return tokens.every((tok) => hay.includes(tok));
  });
}
