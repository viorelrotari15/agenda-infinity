import { describe, expect, it } from 'vitest';
import type { SpecialistDirectoryEntry } from '@agenda/shared';
import {
  filterSpecialistsBySmartSearch,
  normalizeForDirectorySearch,
} from '../smart-directory-search';

const base = (over: Partial<SpecialistDirectoryEntry>): SpecialistDirectoryEntry => ({
  id: '1',
  slug: 's',
  displayName: 'Ion Popescu',
  timezone: 'Europe/Bucharest',
  publicPhotoUrl: null,
  publicBio: null,
  seoTitle: null,
  averageRating: 5,
  reviewCount: 1,
  categories: [],
  sampleServices: [],
  ...over,
});

describe('filterSpecialistsBySmartSearch', () => {
  it('returns all when query empty', () => {
    const list = [base({ id: 'a' }), base({ id: 'b', displayName: 'Other' })];
    expect(filterSpecialistsBySmartSearch(list, '  ')).toEqual(list);
  });

  it('matches display name', () => {
    const list = [base({ displayName: 'Maria Coiffeur' })];
    expect(filterSpecialistsBySmartSearch(list, 'maria')).toHaveLength(1);
    expect(filterSpecialistsBySmartSearch(list, 'xyz')).toHaveLength(0);
  });

  it('matches category and service names', () => {
    const list = [
      base({
        categories: [{ id: 'c1', slug: 'hair', name: 'Hair', isPrimary: true }],
        sampleServices: [{ id: 'sv1', name: 'Cut & style', durationMinutes: 30 }],
      }),
    ];
    expect(filterSpecialistsBySmartSearch(list, 'hair')).toHaveLength(1);
    expect(filterSpecialistsBySmartSearch(list, 'style')).toHaveLength(1);
    expect(filterSpecialistsBySmartSearch(list, 'hair style')).toHaveLength(1);
  });

  it('normalizes diacritics for matching', () => {
    const list = [base({ displayName: 'Ștefan Mălăeru' })];
    expect(filterSpecialistsBySmartSearch(list, 'stefan')).toHaveLength(1);
    expect(filterSpecialistsBySmartSearch(list, 'malaeru')).toHaveLength(1);
  });

  it('requires all tokens to match (AND)', () => {
    const list = [base({ displayName: 'Alpha', publicBio: 'Beta tips' })];
    expect(filterSpecialistsBySmartSearch(list, 'alpha beta')).toHaveLength(1);
    expect(filterSpecialistsBySmartSearch(list, 'alpha gamma')).toHaveLength(0);
  });
});

describe('normalizeForDirectorySearch', () => {
  it('strips marks and lowercases', () => {
    expect(normalizeForDirectorySearch(' Știință ')).toBe('stiinta');
  });
});
