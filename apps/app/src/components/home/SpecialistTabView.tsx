import { IonChip, IonLabel, IonText } from '@ionic/react';
import type { ServiceDto, SpecialistCategoryBadge, SpecialistPublic } from '@agenda/shared';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { agendaKeys } from '../../lib/query-keys';
import { SpecialistAvailablePeriodsList } from '../specialist/SpecialistAvailablePeriodsList';
import { PhotoCarousel } from './PhotoCarousel';
import { ServiceCarousel } from './ServiceCarousel';
import { SpecialistHeroCard } from './SpecialistHeroCard';

type SpecialistsQuery = Pick<UseQueryResult<SpecialistPublic[]>, 'isPending'>;

type Props = {
  specialistsQuery: SpecialistsQuery;
  specialistId: string;
  activeSpecialist: SpecialistPublic | null;
  specialistPhotos: string[];
  services: ServiceDto[];
  isMobileViewport: boolean;
  selectedService: string;
  onSelectServiceAndGoToCalendar: (serviceId: string) => void;
  onPickAvailableSlot: (startIso: string, serviceId: string) => void;
};

export function SpecialistTabView({
  specialistsQuery,
  specialistId,
  activeSpecialist,
  specialistPhotos,
  services,
  isMobileViewport,
  selectedService,
  onSelectServiceAndGoToCalendar,
  onPickAvailableSlot,
}: Props) {
  const { t } = useTranslation();
  const directoryCatsQuery = useQuery({
    queryKey: agendaKeys.specialistDirectoryCategories(specialistId),
    queryFn: () => api.getSpecialistDirectoryCategories(specialistId),
    enabled: Boolean(specialistId),
  });
  return (
    <div className="home-section-stack">
      {!specialistsQuery.isPending && !specialistId ? (
        <IonText color="warning">
          <p>{t('home.createSpecialistFirst')}</p>
        </IonText>
      ) : null}

      {specialistsQuery.isPending ? (
        <IonText color="medium">
          <p>{t('home.loadingSpecialists')}</p>
        </IonText>
      ) : null}

      {activeSpecialist ? (
        <SpecialistHeroCard
          displayName={activeSpecialist.displayName}
          heroPhotoUrl={specialistPhotos[0]}
        />
      ) : null}

      {directoryCatsQuery.data?.length ? (
        <div className="home-directory-badges" aria-label={t('home.directoryCategoriesAria')}>
          <p className="home-directory-badges__label">{t('home.directoryCategories')}</p>
          <div className="home-directory-badges__chips">
            {directoryCatsQuery.data.map((b: SpecialistCategoryBadge) => (
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

      {specialistId && services.length ? (
        <SpecialistAvailablePeriodsList
          specialistId={specialistId}
          services={services}
          onPickSlot={onPickAvailableSlot}
        />
      ) : null}

      <ServiceCarousel
        services={services}
        specialistId={specialistId}
        isMobileViewport={isMobileViewport}
        selectedServiceId={selectedService}
        onSelectServiceAndGoToCalendar={onSelectServiceAndGoToCalendar}
      />

      {activeSpecialist ? (
        <PhotoCarousel
          photos={specialistPhotos}
          specialistId={specialistId}
          displayName={activeSpecialist.displayName}
        />
      ) : null}
    </div>
  );
}
