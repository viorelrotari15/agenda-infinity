import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';

export function useBannersQuery() {
  return useQuery({
    queryKey: agendaKeys.banners(),
    queryFn: () => api.listBanners(),
  });
}
