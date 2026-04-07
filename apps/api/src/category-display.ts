import type { Category } from '@prisma/client';
import type { AppLocale } from './i18n/locale-context';

export function categoryLabel(
  cat: Pick<Category, 'nameEn' | 'nameRo' | 'nameRu'>,
  locale: AppLocale,
): string {
  if (locale === 'ro') return cat.nameRo;
  if (locale === 'ru') return cat.nameRu;
  return cat.nameEn;
}
