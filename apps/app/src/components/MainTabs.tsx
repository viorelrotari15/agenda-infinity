import { IonIcon, IonLabel, IonRouterOutlet, IonTabBar, IonTabButton, IonTabs } from '@ionic/react';
import { Redirect, Route } from 'react-router-dom';
import {
  calendarOutline,
  compassOutline,
  settingsOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import AdminPage from '../pages/AdminPage';
import AgendaPage from '../pages/AgendaPage';
import SpecialistBookingDetailPage from '../pages/SpecialistBookingDetailPage';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import { useTranslation } from 'react-i18next';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { hasStoredAccessToken } from '../lib/auth-session';

export default function MainTabs() {
  const { t } = useTranslation();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const isAdmin = meQuery.data?.role === 'ADMIN';

  return (
    <IonTabs>
      <IonRouterOutlet>
        <Route path="/tabs/book" component={HomePage} exact />
        <Route path="/tabs/agenda/booking/:id" component={SpecialistBookingDetailPage} exact />
        <Route path="/tabs/agenda" component={AgendaPage} exact />
        <Route path="/tabs/settings" component={SettingsPage} exact />
        <Route path="/tabs/admin" component={AdminPage} exact />
        <Route path="/tabs" exact render={() => <Redirect to="/tabs/book" />} />
      </IonRouterOutlet>

      <IonTabBar slot="bottom" className="main-tab-bar">
        <IonTabButton tab="book" href="/tabs/book">
          <IonIcon aria-hidden="true" icon={compassOutline} />
          <IonLabel>{t('tabs.book')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="agenda" href="/tabs/agenda">
          <IonIcon aria-hidden="true" icon={calendarOutline} />
          <IonLabel>{t('tabs.agenda')}</IonLabel>
        </IonTabButton>
        <IonTabButton tab="settings" href="/tabs/settings">
          <IonIcon aria-hidden="true" icon={settingsOutline} />
          <IonLabel>{t('tabs.settings')}</IonLabel>
        </IonTabButton>
        {isAdmin ? (
          <IonTabButton tab="admin" href="/tabs/admin">
            <IonIcon aria-hidden="true" icon={shieldCheckmarkOutline} />
            <IonLabel>{t('tabs.admin')}</IonLabel>
          </IonTabButton>
        ) : null}
      </IonTabBar>
    </IonTabs>
  );
}
