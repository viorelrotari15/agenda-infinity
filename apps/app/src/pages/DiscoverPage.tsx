import {
  IonChip,
  IonContent,
  IonLabel,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSearchbar,
  IonSegment,
  IonSegmentButton,
  IonText,
} from '@ionic/react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { CenteredPageSpinner } from '../components/CenteredPageSpinner';
import { DiscoverGuestAuthActions } from '../components/DiscoverGuestAuthActions';
import { SpecialistDirectoryCard } from '../components/specialist/SpecialistDirectoryCard';
import { applyGuestViewBoost } from '../lib/specialists/guestBoostRanking';
import { getGuestViewIdOrder, recordSpecialistView } from '../lib/specialists/guest-view-storage';
import { filterSpecialistsBySmartSearch } from '../lib/specialists/smart-directory-search';
import { api } from '../lib/api';
import { hasStoredAccessToken } from '../lib/auth-session';
import { agendaKeys } from '../lib/query-keys';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import type { SpecialistCategoryBadge, SpecialistDirectoryEntry } from '@agenda/shared';

type SortMode = 'rating' | 'name' | 'recommended';

export default function DiscoverPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const hasToken = hasStoredAccessToken();
  const meQuery = useMeQuery(hasToken);
  const me = meQuery.data;
  const isClient = me?.role === 'CLIENT';

  const [categorySlug, setCategorySlug] = useState<string | undefined>(undefined);
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [searchQuery, setSearchQuery] = useState('');

  const categoriesQuery = useQuery({
    queryKey: agendaKeys.publicCategories(),
    queryFn: () => api.listPublicCategories(),
  });

  const apiSort: 'rating' | 'name' | 'recommended' =
    sortMode === 'recommended' && isClient
      ? 'recommended'
      : sortMode === 'recommended'
        ? 'rating'
        : sortMode;

  const specialistsQuery = useQuery({
    queryKey: agendaKeys.publicSpecialists(categorySlug, `${apiSort}:${sortMode}`),
    queryFn: () =>
      api.listPublicSpecialists({
        categorySlug: categorySlug || undefined,
        sort: apiSort,
      }),
  });

  const displayList = useMemo((): SpecialistDirectoryEntry[] => {
    const raw = specialistsQuery.data ?? [];
    if (sortMode === 'recommended' && !isClient) {
      return applyGuestViewBoost(raw, getGuestViewIdOrder());
    }
    return raw;
  }, [specialistsQuery.data, sortMode, isClient]);

  const filteredList = useMemo(
    () => filterSpecialistsBySmartSearch(displayList, searchQuery),
    [displayList, searchQuery],
  );

  const onRefresh = async (ev: CustomEvent) => {
    await queryClient.invalidateQueries({ queryKey: agendaKeys.publicCategories() });
    await queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    ev.detail.complete();
  };

  return (
    <IonPage>
      <AppHeader
        title={t('directory.title')}
        secondaryToolbar={
          <IonSearchbar
            value={searchQuery}
            debounce={200}
            inputMode="search"
            enterkeyhint="search"
            placeholder={t('directory.searchPlaceholder')}
            className="discover-searchbar"
            onIonInput={(e) => setSearchQuery(String(e.detail.value ?? ''))}
          />
        }
      />
      <IonContent fullscreen className="discover-content">
        <IonRefresher slot="fixed" onIonRefresh={onRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        <div className="discover-page">
          {me?.role === 'SPECIALIST' &&
          me.specialistProfile?.categories &&
          me.specialistProfile.categories.length > 0 ? (
            <div className="discover-page__my-badges">
              <p className="discover-page__my-badges-label">{t('directory.yourCategories')}</p>
              <div className="discover-page__chips">
                {me.specialistProfile.categories.map((b: SpecialistCategoryBadge) => (
                  <IonChip
                    key={b.slug}
                    color={b.isPrimary ? 'primary' : undefined}
                    outline={!b.isPrimary}
                  >
                    <IonLabel>{b.name}</IonLabel>
                  </IonChip>
                ))}
              </div>
            </div>
          ) : null}

          <p className="discover-page__intro">{t('directory.intro')}</p>

          <IonSegment
            value={sortMode}
            onIonChange={(e) => {
              const v = e.detail.value as SortMode | undefined;
              if (v) setSortMode(v);
            }}
            className="discover-page__sort"
          >
            <IonSegmentButton value="recommended">
              <IonLabel>{t('directory.sort.recommended')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="rating">
              <IonLabel>{t('directory.sort.rating')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="name">
              <IonLabel>{t('directory.sort.name')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          {isClient ? (
            <IonText color="medium">
              <p className="discover-page__hint">{t('directory.hintInterests')}</p>
            </IonText>
          ) : (
            <IonText color="medium">
              <p className="discover-page__hint">{t('directory.hintGuest')}</p>
            </IonText>
          )}

          <div className="discover-page__chips">
            <IonChip
              outline={!categorySlug}
              color={!categorySlug ? 'primary' : undefined}
              onClick={() => setCategorySlug(undefined)}
            >
              <IonLabel>{t('directory.allCategories')}</IonLabel>
            </IonChip>
            {(categoriesQuery.data ?? []).map((c) => (
              <IonChip
                key={c.id}
                outline={categorySlug !== c.slug}
                color={categorySlug === c.slug ? 'primary' : undefined}
                onClick={() => setCategorySlug(c.slug === categorySlug ? undefined : c.slug)}
              >
                <IonLabel>
                  {t('directory.categoryWithCount', {
                    name: c.name,
                    count: c.specialistCount,
                  })}
                </IonLabel>
              </IonChip>
            ))}
          </div>

          {specialistsQuery.isLoading ? (
            <CenteredPageSpinner />
          ) : specialistsQuery.isError ? (
            <p className="discover-page__error">{t('directory.loadError')}</p>
          ) : displayList.length === 0 ? (
            <p className="discover-page__empty">{t('directory.empty')}</p>
          ) : filteredList.length === 0 ? (
            <p className="discover-page__empty">{t('directory.searchNoResults')}</p>
          ) : (
            <div className="discover-page__list">
              {filteredList.map((s) => (
                <SpecialistDirectoryCard
                  key={s.id}
                  specialist={s}
                  bookOnly={searchQuery.trim().length > 0}
                  onOpen={() => recordSpecialistView(s.id)}
                />
              ))}
            </div>
          )}

          {!hasToken ? (
            <DiscoverGuestAuthActions
              signInLabel={t('app.signIn')}
              createAccountLabel={t('directory.createAccount')}
            />
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
}
