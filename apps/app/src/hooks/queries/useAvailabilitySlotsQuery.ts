import type { Slot } from '@agenda/shared';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { api } from '../../lib/api';
import {
  AVAILABILITY_LOOKAHEAD_DAYS,
  availabilityQueryRange,
  sortSlotsByStartAsc,
} from '../../lib/availablePeriods';
import { agendaKeys } from '../../lib/query-keys';
import { localDateKey } from '../../components/agenda/agendaUtils';

export function useAvailabilitySlotsQuery(specialistId: string, serviceId: string | null) {
  const range = useMemo(() => availabilityQueryRange(AVAILABILITY_LOOKAHEAD_DAYS), [
    localDateKey(new Date()),
  ]);

  return useQuery({
    queryKey:
      specialistId && serviceId
        ? agendaKeys.availability(specialistId, serviceId, range.from, range.to)
        : ([...agendaKeys.all, 'availability', 'idle'] as const),
    queryFn: () =>
      api.getAvailability({
        specialistId: specialistId!,
        serviceId: serviceId!,
        from: range.from,
        to: range.to,
      }),
    enabled: Boolean(specialistId && serviceId),
    select: (raw: Slot[]) => sortSlotsByStartAsc(Array.isArray(raw) ? raw : []),
  });
}
