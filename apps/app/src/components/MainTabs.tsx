import { IonIcon, IonRedirect, IonRouterOutlet } from '@ionic/react';
import type { ComponentProps } from 'react';
import { Route, NavLink, useLocation } from 'react-router-dom';
import {
  calendarOutline,
  homeOutline,
  personCircleOutline,
  settingsOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import AdminPage from '../pages/AdminPage';
import AgendaPage from '../pages/AgendaPage';
import DiscoverPage from '../pages/DiscoverPage';
import AgendaBookingDetailPage from '../pages/AgendaBookingDetailPage';
import HomePage from '../pages/HomePage';
import SettingsPage from '../pages/SettingsPage';
import SpecialistAvailabilityPage from '../pages/SpecialistAvailabilityPage';
import SpecialistMyPage from '../pages/SpecialistMyPage';
import { useTranslation } from 'react-i18next';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { hasStoredAccessToken } from '../lib/auth-session';

type TabItem = {
  to: string;
  exact?: boolean;
  tab: string;
  icon: ComponentProps<typeof IonIcon>['icon'];
  label: string;
};

function BottomTabNav({ items }: { items: TabItem[] }) {
  return (
    <nav className="main-tab-bar main-tab-bar--custom" aria-label="Main">
      {items.map(({ to, exact, tab, icon, label }) => (
        <NavLink
          key={tab}
          to={to}
          exact={exact}
          className="main-tab-link"
          activeClassName="main-tab-link--active"
        >
          <IonIcon icon={icon} aria-hidden="true" className="main-tab-link__icon" />
          <span className="main-tab-link__label">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

/**
 * Plain IonRouterOutlet + custom bottom nav. Ionic's IonTabs wraps the tree in PageManager
 * (extra ion-page), which breaks ion-tab-bar / leaves an empty white strip on some WebKit builds.
 */
export default function MainTabs() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const isSpecialist = meQuery.data?.role === 'SPECIALIST';
  const isClient = meQuery.data?.role === 'CLIENT';
  const isAdmin = meQuery.data?.role === 'ADMIN';
  const bookOnlySearchFlow =
    pathname === '/tabs/book' && new URLSearchParams(search).get('bookOnly') === '1';

  const adminItem: TabItem | null = isAdmin
    ? {
        to: '/tabs/admin',
        exact: true,
        tab: 'admin',
        icon: shieldCheckmarkOutline,
        label: t('tabs.admin'),
      }
    : null;

  let items: TabItem[];
  if (bookOnlySearchFlow) {
    items = [
      {
        to: '/tabs/discover',
        exact: true,
        tab: 'discover',
        icon: homeOutline,
        label: t('tabs.home'),
      },
      ...(isClient
        ? [
            {
              to: '/tabs/agenda',
              exact: true,
              tab: 'agenda',
              icon: calendarOutline,
              label: t('tabs.agenda'),
            } satisfies TabItem,
          ]
        : []),
      {
        to: '/tabs/settings',
        exact: true,
        tab: 'settings',
        icon: settingsOutline,
        label: t('tabs.settings'),
      },
    ];
  } else if (isSpecialist) {
    items = [
      {
        to: '/tabs/discover',
        exact: true,
        tab: 'discover',
        icon: homeOutline,
        label: t('tabs.home'),
      },
      {
        to: '/tabs/specialist/my-page',
        exact: true,
        tab: 'specialist-my',
        icon: personCircleOutline,
        label: t('tabs.myPage'),
      },
      {
        to: '/tabs/specialist/availability',
        exact: true,
        tab: 'specialist-availability',
        icon: timeOutline,
        label: t('tabs.availability'),
      },
      {
        to: '/tabs/settings',
        exact: true,
        tab: 'settings',
        icon: settingsOutline,
        label: t('tabs.settings'),
      },
    ];
    if (adminItem) items.push(adminItem);
  } else {
    items = [
      {
        to: '/tabs/discover',
        exact: true,
        tab: 'discover',
        icon: homeOutline,
        label: t('tabs.home'),
      },
      ...(isClient
        ? [
            {
              to: '/tabs/agenda',
              exact: true,
              tab: 'agenda',
              icon: calendarOutline,
              label: t('tabs.agenda'),
            } satisfies TabItem,
          ]
        : []),
      {
        to: '/tabs/settings',
        exact: true,
        tab: 'settings',
        icon: settingsOutline,
        label: t('tabs.settings'),
      },
    ];
    if (adminItem) items.push(adminItem);
  }

  return (
    <div className="app-tabs-layout">
      <IonRouterOutlet>
        <Route path="/tabs/specialist/my-page" component={SpecialistMyPage} exact />
        <Route path="/tabs/specialist/availability" component={SpecialistAvailabilityPage} exact />
        <Route path="/tabs/discover" component={DiscoverPage} exact />
        <Route path="/tabs/book" component={HomePage} exact />
        <Route path="/tabs/agenda/booking/:id" component={AgendaBookingDetailPage} exact />
        <Route path="/tabs/agenda" component={AgendaPage} exact />
        <Route path="/tabs/settings" component={SettingsPage} exact />
        <Route path="/tabs/admin" component={AdminPage} exact />
        <Route path="/tabs" exact render={() => <IonRedirect to="/tabs/discover" />} />
      </IonRouterOutlet>
      <BottomTabNav items={items} />
    </div>
  );
}
