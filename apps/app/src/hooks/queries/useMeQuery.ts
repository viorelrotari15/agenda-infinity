import { AgendaApiError } from '@agenda/api-client';
import type { MeUser } from '@agenda/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { clearSession } from '../../lib/auth-session';
import { agendaKeys } from '../../lib/query-keys';

export function useMeQuery(enabled: boolean) {
  return useQuery<MeUser>({
    queryKey: agendaKeys.me(),
    queryFn: async () => {
      try {
        return await api.me();
      } catch (e) {
        if (e instanceof AgendaApiError && e.status === 401) {
          clearSession();
        }
        throw e;
      }
    },
    enabled,
    retry: false,
  });
}
