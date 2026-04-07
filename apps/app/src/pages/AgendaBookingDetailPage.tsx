import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { CenteredPageSpinner } from '../components/CenteredPageSpinner';
import { hasStoredAccessToken } from '../lib/auth-session';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import ClientBookingDetailPage from './ClientBookingDetailPage';
import SpecialistBookingDetailPage from './SpecialistBookingDetailPage';

export default function AgendaBookingDetailPage() {
  const { t } = useTranslation();
  const meQuery = useMeQuery(hasStoredAccessToken());

  if (meQuery.isLoading) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/agenda" text={t('sessionDetail.back')} />
            </IonButtons>
            <IonTitle>{t('sessionDetail.title')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <CenteredPageSpinner />
        </IonContent>
      </IonPage>
    );
  }

  const role = meQuery.data?.role;
  if (role === 'CLIENT') return <ClientBookingDetailPage />;
  if (role === 'SPECIALIST') return <SpecialistBookingDetailPage />;

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/discover" text={t('app.back')} />
          </IonButtons>
          <IonTitle>{t('sessionDetail.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent fullscreen className="app-content ion-padding">
        <IonText color="medium">
          <p>{t('sessionDetail.agendaBookingRoleHint')}</p>
        </IonText>
      </IonContent>
    </IonPage>
  );
}
