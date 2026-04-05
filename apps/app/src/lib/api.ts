import { AgendaApiClient } from '@agenda/api-client';
import { getLocaleTag } from '../i18n/i18n';
import { setSessionTokens } from './auth-session';

const fromEnv = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
const baseUrl =
  fromEnv && fromEnv.length > 0
    ? fromEnv.replace(/\/$/, '')
    : import.meta.env.DEV
      ? '/api'
      : 'http://localhost:3001/api';

export const api = new AgendaApiClient(
  baseUrl,
  () => (typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null),
  () => getLocaleTag(),
);

export async function createClientAccount(input: {
  email: string;
  password: string;
  phone: string;
}) {
  const tokens = await api.registerClient(input);
  setSessionTokens(tokens);
  return tokens;
}

export async function createSpecialistAccount(input: {
  email: string;
  password: string;
  phone: string;
  displayName: string;
  slug: string;
  timezone?: string;
}) {
  const tokens = await api.registerSpecialist(input);
  setSessionTokens(tokens);
  return tokens;
}
