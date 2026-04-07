import { IonContent, IonPage } from '@ionic/react';
import { Redirect } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppHeaderPageLoading } from '../components/AppHeaderPageLoading';
import { AppHeader } from '../components/AppHeader';
import { SpecialistWorkPanel } from '../components/settings/SpecialistWorkPanel';
import { hasStoredAccessToken } from '../lib/auth-session';
import { useMeQuery } from '../hooks/queries/useMeQuery';

export default function SpecialistAvailabilityPage() {
  const { t } = useTranslation();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  if (meQuery.isLoading) {
    return <AppHeaderPageLoading title={t('tabs.availability')} />;
  }

  if (me?.role !== 'SPECIALIST') {
    return <Redirect to="/tabs/discover" />;
  }

  return (
    <IonPage>
      <AppHeader title={t('tabs.availability')} />
      <IonContent fullscreen className="app-content ion-padding settings-page">
        <div className="settings-shell">
          <header className="settings-hero">
            <h1 className="settings-title">{t('specialistAvailability.heroTitle')}</h1>
            <p className="settings-sub">{t('specialistAvailability.heroSub')}</p>
          </header>
          <SpecialistWorkPanel />
        </div>
      </IonContent>
    </IonPage>
  );
}
