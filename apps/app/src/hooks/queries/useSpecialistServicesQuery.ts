import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';

export function useSpecialistServicesQuery(specialistId: string) {
  return useQuery({
    queryKey: agendaKeys.specialistServices(specialistId),
    queryFn: () => api.getServices(specialistId),
    enabled: Boolean(specialistId),
  });
}
