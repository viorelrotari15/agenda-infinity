import { IonText } from '@ionic/react';
import type { ServiceDto, SpecialistPublic } from '@agenda/shared';
import { useTranslation } from 'react-i18next';
import type { UseQueryResult } from '@tanstack/react-query';
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
}: Props) {
  const { t } = useTranslation();
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
