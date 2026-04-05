import { AsyncLocalStorage } from 'node:async_hooks';

export type AppLocale = 'en' | 'ro' | 'ru';

export const localeStorage = new AsyncLocalStorage<AppLocale>();

export function getLocale(): AppLocale {
  return localeStorage.getStore() ?? 'en';
}

export function localeFromHeader(h?: string): AppLocale {
  if (!h) return 'en';
  const first = h.split(',')[0]?.trim().split('-')[0]?.toLowerCase();
  if (first === 'ro') return 'ro';
  if (first === 'ru') return 'ru';
  return 'en';
}
