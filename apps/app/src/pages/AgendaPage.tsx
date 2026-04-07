import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonContent,
  IonNote,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonRouterLink,
  IonText,
} from '@ionic/react';
import { calendarOutline, listOutline } from 'ionicons/icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { AgendaDayPlan } from '../components/agenda/AgendaDayPlan';
import { AgendaGroupedList } from '../components/agenda/AgendaGroupedList';
import type { AgendaEntry } from '../components/agenda/agendaUtils';
import { startOfLocalDay } from '../components/agenda/agendaUtils';
import { AppHeader } from '../components/AppHeader';
import { PillSegmentedControl } from '../components/PillSegmentedControl';
import { api } from '../lib/api';
import { hasStoredAccessToken } from '../lib/auth-session';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { agendaKeys } from '../lib/query-keys';
import type { BookingEvent } from '@agenda/shared';

function rangeIso() {
  const from = new Date();
  from.setMonth(from.getMonth() - 1);
  from.setHours(0, 0, 0, 0);
  const to = new Date();
  to.setMonth(to.getMonth() + 6);
  return { from: from.toISOString(), to: to.toISOString() };
}

function mapSpecialist(items: BookingEvent[]): AgendaEntry[] {
  return items.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    status: ev.status,
  }));
}

function mapClient(
  items: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    status: string;
    specialistName: string;
  }>,
): AgendaEntry[] {
  return items.map((ev) => ({
    id: ev.id,
    title: ev.title,
    start: ev.start,
    end: ev.end,
    status: ev.status,
    subtitle: ev.specialistName,
  }));
}

export default function AgendaPage() {
  const { t } = useTranslation();
  const history = useHistory();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;
  const range = useMemo(() => rangeIso(), []);

  const specialistQ = useQuery({
    queryKey: [...agendaKeys.all, 'specialist-agenda', range.from, range.to],
    queryFn: () => api.specialistBookings(range),
    enabled: me?.role === 'SPECIALIST',
  });

  const clientQ = useQuery({
    queryKey: [...agendaKeys.all, 'client-agenda', range.from, range.to],
    queryFn: () => api.clientBookings(range),
    enabled: me?.role === 'CLIENT',
  });

  const [view, setView] = useState<'list' | 'day'>('day');
  const [focusDay, setFocusDay] = useState(() => startOfLocalDay(new Date()));

  const entries: AgendaEntry[] = useMemo(() => {
    if (me?.role === 'SPECIALIST') return mapSpecialist(specialistQ.data ?? []);
    if (me?.role === 'CLIENT') return mapClient(clientQ.data ?? []);
    return [];
  }, [me?.role, specialistQ.data, clientQ.data]);

  const loading =
    me?.role === 'SPECIALIST'
      ? specialistQ.isPending
      : me?.role === 'CLIENT'
        ? clientQ.isPending
        : false;

  const refresh = async (e: CustomEvent) => {
    const target = e.target as HTMLIonRefresherElement;
    try {
      if (me?.role === 'SPECIALIST') await specialistQ.refetch();
      if (me?.role === 'CLIENT') await clientQ.refetch();
    } finally {
      target.complete();
    }
  };

  const adminHint = me?.role === 'ADMIN';
  const openBooking =
    me?.role === 'SPECIALIST' || me?.role === 'CLIENT'
      ? (bookingId: string) => history.push(`/tabs/agenda/booking/${bookingId}`)
      : undefined;

  return (
    <IonPage>
      <AppHeader title={t('agenda.title')} />
      <IonContent fullscreen className="app-content ion-padding agenda-page agenda-page--v2">
        <IonRefresher slot="fixed" onIonRefresh={refresh}>
          <IonRefresherContent />
        </IonRefresher>

        {!me ? (
          <IonCard className="ui-elevated">
            <IonCardHeader>
              <IonCardTitle>{t('agenda.signInTitle')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>{t('agenda.signInBody')}</p>
              </IonText>
              <IonButton expand="block" routerLink="/login" className="ion-margin-top">
                {t('settings.signIn')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : null}

        {adminHint ? (
          <IonCard className="ui-elevated ion-margin-bottom">
            <IonCardHeader>
              <IonCardTitle>{t('agenda.adminTitle')}</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonText color="medium">
                <p>{t('agenda.adminBody')}</p>
              </IonText>
              <IonButton expand="block" routerLink="/tabs/admin" className="ion-margin-top">
                {t('agenda.openAdmin')}
              </IonButton>
            </IonCardContent>
          </IonCard>
        ) : null}

        {me?.role === 'SPECIALIST' || me?.role === 'CLIENT' ? (
          <div className="agenda-hero">
            <h1 className="agenda-hero-title">
              {me.role === 'SPECIALIST' ? t('agenda.scheduleTitle') : t('agenda.visitsTitle')}
            </h1>
            <p className="agenda-hero-lead">
              {me.role === 'SPECIALIST' ? t('agenda.scheduleLead') : t('agenda.visitsLead')}
            </p>

            <PillSegmentedControl
              className="agenda-hero-segment"
              value={view}
              onChange={setView}
              options={[
                { value: 'day', label: t('agenda.dayPlan'), icon: calendarOutline },
                { value: 'list', label: t('agenda.allSessions'), icon: listOutline },
              ]}
            />

            {loading ? (
              <IonText color="medium">
                <p className="agenda-loading">{t('agenda.loading')}</p>
              </IonText>
            ) : view === 'day' ? (
              <AgendaDayPlan
                focusDay={focusDay}
                onDayChange={(d) => setFocusDay(startOfLocalDay(d))}
                entries={entries}
                onSessionClick={openBooking}
              />
            ) : (
              <>
                <div className="agenda-list-intro">
                  <IonNote>{t('agenda.listIntro')}</IonNote>
                </div>
                <AgendaGroupedList
                  entries={entries}
                  onSessionClick={openBooking}
                  statusPerspective={me.role === 'CLIENT' ? 'client' : 'specialist'}
                />
              </>
            )}
          </div>
        ) : null}

        {me?.role === 'CLIENT' ? (
          <p className="agenda-footer-hint">
            {t('agenda.footerClient')}{' '}
            <IonRouterLink className="agenda-inline-link" routerLink="/tabs/discover">
              {t('agenda.bookSlot')}
            </IonRouterLink>
          </p>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
