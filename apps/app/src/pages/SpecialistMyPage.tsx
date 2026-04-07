import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonPage,
  IonText,
} from '@ionic/react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeaderPageLoading } from '../components/AppHeaderPageLoading';
import { AppHeader } from '../components/AppHeader';
import { SpecialistMediaPanel } from '../components/specialist/SpecialistMediaPanel';
import { hasStoredAccessToken } from '../lib/auth-session';
import { useMeQuery } from '../hooks/queries/useMeQuery';

export default function SpecialistMyPage() {
  const { t } = useTranslation();
  const hasToken = hasStoredAccessToken();
  const meQuery = useMeQuery(hasToken);
  const me = meQuery.data;

  useEffect(() => {
    if (hasToken) return;
    // Hard redirect: avoids edge cases where IonRouterOutlet does not apply in-app redirects.
    window.location.assign('/tabs/discover');
  }, [hasToken]);

  if (!hasToken) return null;

  if (meQuery.isLoading) {
    return <AppHeaderPageLoading title={t('tabs.myPage')} />;
  }

  if (me?.role !== 'SPECIALIST' || !me.specialistProfile) {
    window.location.assign('/tabs/discover');
    return null;
  }

  const p = me.specialistProfile;

  return (
    <IonPage>
      <AppHeader title={t('tabs.myPage')} />
      <IonContent fullscreen className="app-content ion-padding settings-page">
        <div className="settings-shell">
          <header className="settings-hero">
            <h1 className="settings-title">{t('specialistMyPage.heroTitle')}</h1>
            <p className="settings-sub">{t('specialistMyPage.heroSub')}</p>
          </header>

          <IonCard className="ui-elevated ion-no-margin">
            <IonCardHeader>
              <IonCardTitle>{p.displayName}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <p className="settings-muted">/{p.slug}</p>
              {p.publicBio ? (
                <IonText>
                  <p className="ion-margin-top">{p.publicBio}</p>
                </IonText>
              ) : (
                <IonText color="medium">
                  <p className="ion-margin-top">{t('specialistMyPage.noBio')}</p>
                </IonText>
              )}
              {p.seoTitle ? (
                <p className="ion-margin-top settings-muted">
                  <strong>{t('settings.seoTitle')}:</strong> {p.seoTitle}
                </p>
              ) : null}
              <IonButton
                expand="block"
                shape="round"
                className="ion-margin-top"
                routerLink="/tabs/settings"
              >
                {t('specialistMyPage.editInSettings')}
              </IonButton>
            </IonCardContent>
          </IonCard>

          <SpecialistMediaPanel publicPhotoUrl={p.publicPhotoUrl} galleryImages={p.galleryImages} />
        </div>
      </IonContent>
    </IonPage>
  );
}
