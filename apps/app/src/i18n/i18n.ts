import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.json';
import ro from './locales/ro.json';
import ru from './locales/ru.json';

export const supportedLngs = ['en', 'ro', 'ru'] as const;
export type AppLng = (typeof supportedLngs)[number];

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ro: { translation: ro },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    supportedLngs: [...supportedLngs],
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'agenda-lang',
    },
  })
  .then(() => {
    document.documentElement.lang = i18n.resolvedLanguage ?? 'en';
    document.title = i18n.t('app.title');
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.title = i18n.t('app.title');
});

export function getLocaleTag(): string {
  return i18n.resolvedLanguage ?? i18n.language ?? 'en';
}

export default i18n;
