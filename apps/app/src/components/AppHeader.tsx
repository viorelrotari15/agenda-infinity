import { IonButton, IonButtons, IonHeader, IonIcon, IonTitle, IonToolbar } from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import markUrl from '../assets/brand/mark.svg';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { hasStoredAccessToken } from '../lib/auth-session';

type Props = {
  title?: string;
};

export function AppHeader({ title }: Props) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('app.title');
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  return (
    <IonHeader className="app-header ion-no-border">
      <IonToolbar className="app-toolbar">
        <IonTitle>
          <span className="app-title">
            <img className="app-title-mark" src={markUrl} alt="" aria-hidden="true" />
            <span className="app-title-text">{resolvedTitle}</span>
          </span>
        </IonTitle>
        <IonButtons slot="end">
          <IonButton
            fill="clear"
            className="app-header-account"
            routerLink={me ? '/tabs/settings' : '/login'}
            routerDirection="forward"
            aria-label={me ? t('app.account') : t('app.signIn')}
          >
            <IonIcon slot="icon-only" icon={personCircleOutline} />
          </IonButton>
        </IonButtons>
      </IonToolbar>
    </IonHeader>
  );
}
