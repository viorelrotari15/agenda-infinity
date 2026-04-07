import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonHeader,
  IonIcon,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { personCircleOutline } from 'ionicons/icons';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import markUrl from '../assets/brand/mark.svg';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { hasStoredAccessToken } from '../lib/auth-session';

type Props = {
  title?: string;
  /** Second row below the title (e.g. directory search), visually part of the same header. */
  secondaryToolbar?: ReactNode;
  /** When set, shows a leading back control (fallback route if there is no history entry). */
  backHref?: string;
  /** Visible label for the back control; defaults to a generic “Back” string. */
  backText?: string;
};

export function AppHeader({ title, secondaryToolbar, backHref, backText }: Props) {
  const { t } = useTranslation();
  const resolvedTitle = title ?? t('app.title');
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  return (
    <IonHeader
      className={`app-header ion-no-border${secondaryToolbar ? ' app-header--with-secondary' : ''}`}
    >
      <IonToolbar className="app-toolbar">
        {backHref ? (
          <IonButtons slot="start">
            <IonBackButton defaultHref={backHref} text={backText ?? t('app.back')} />
          </IonButtons>
        ) : null}
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
      {secondaryToolbar ? (
        <IonToolbar className="app-toolbar app-toolbar--secondary toolbar-searchbar">
          <div className="app-toolbar-secondary-inner">{secondaryToolbar}</div>
        </IonToolbar>
      ) : null}
    </IonHeader>
  );
}
