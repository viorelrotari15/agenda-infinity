import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';

export function useSpecialistsQuery() {
  return useQuery({
    queryKey: agendaKeys.specialists(),
    queryFn: () => api.listSpecialists(),
  });
}
