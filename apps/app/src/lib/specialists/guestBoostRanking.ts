/**
 * Reorders specialists so previously viewed ids (guest localStorage) appear first,
 * while preserving relative order within each tier (stable merge by original index).
 */
export function applyGuestViewBoost<T extends { id: string }>(
  items: T[],
  recentIdsDescending: string[],
): T[] {
  if (!recentIdsDescending.length) return items;
  const boost = new Map<string, number>();
  recentIdsDescending.forEach((id, i) => {
    if (!boost.has(id)) boost.set(id, recentIdsDescending.length - i);
  });
  return [...items].sort((a, b) => {
    const ba = boost.get(a.id) ?? 0;
    const bb = boost.get(b.id) ?? 0;
    if (bb !== ba) return bb - ba;
    const ia = items.findIndex((x) => x.id === a.id);
    const ib = items.findIndex((x) => x.id === b.id);
    return ia - ib;
  });
}
