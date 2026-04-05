import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';

function slotFromApi(raw: unknown): { start: string; end: string } | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const start = o.start ?? o.startUtc;
  const end = o.end ?? o.endUtc;
  if (typeof start === 'string' && typeof end === 'string') {
    return { start, end };
  }
  return null;
}

export function useOccupiedSlotsQuery(
  specialistId: string,
  range: { from: string; to: string } | null,
  refreshNonce = 0,
) {
  return useQuery({
    queryKey:
      range && specialistId
        ? [...agendaKeys.occupied(specialistId, range.from, range.to), refreshNonce]
        : ([...agendaKeys.all, 'occupied', 'idle'] as const),
    queryFn: () =>
      api.getOccupied({
        specialistId,
        from: range!.from,
        to: range!.to,
      }),
    enabled: Boolean(specialistId && range),
    select: (raw) => {
      const list = Array.isArray(raw) ? raw : [];
      return list.map(slotFromApi).filter((s): s is { start: string; end: string } => s != null);
    },
  });
}
