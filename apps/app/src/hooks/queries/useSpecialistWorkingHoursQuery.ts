import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';

export function useSpecialistWorkingHoursQuery(specialistId: string) {
  return useQuery({
    queryKey: agendaKeys.specialistWorkingHours(specialistId),
    queryFn: () => api.getSpecialistWorkingHours(specialistId),
    enabled: Boolean(specialistId),
  });
}
