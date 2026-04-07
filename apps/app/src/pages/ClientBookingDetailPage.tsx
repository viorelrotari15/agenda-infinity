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
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingStatusClass, bookingStatusLabel } from '../components/agenda/bookingStatusUi';
import { CenteredPageSpinner } from '../components/CenteredPageSpinner';
import { api } from '../lib/api';
import { agendaKeys } from '../lib/query-keys';
import { getLocaleTag } from '../i18n/i18n';

export default function ClientBookingDetailPage() {
  const { t } = useTranslation();
  const loc = getLocaleTag();
  const { id } = useParams<{ id: string }>();

  const q = useQuery({
    queryKey: agendaKeys.clientBooking(id ?? ''),
    queryFn: () => api.clientBooking(id!),
    enabled: Boolean(id),
  });

  const b = q.data;
  const start = b ? new Date(b.start) : null;
  const end = b ? new Date(b.end) : null;
  const timeFmt = new Intl.DateTimeFormat(loc, { hour: 'numeric', minute: '2-digit' });
  const dateFmt = new Intl.DateTimeFormat(loc, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

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
      <IonContent fullscreen className="app-content ion-padding specialist-booking-detail">
        {q.isPending ? (
          <CenteredPageSpinner className="specialist-booking-detail-loading" />
        ) : q.isError ? (
          <IonText color="danger">
            <p>{q.error instanceof Error ? q.error.message : t('sessionDetail.loadError')}</p>
          </IonText>
        ) : b ? (
          <>
            <div className="specialist-booking-detail-hero">
              <span className={bookingStatusClass(b.status)}>{bookingStatusLabel(b.status, 'client')}</span>
              <h1 className="specialist-booking-detail-title">{b.serviceName}</h1>
              <p className="specialist-booking-detail-sub">{b.title}</p>
            </div>

            <section
              className="specialist-booking-detail-section"
              aria-label={t('sessionDetail.when')}
            >
              <h2 className="specialist-booking-detail-h2">{t('sessionDetail.when')}</h2>
              <p className="specialist-booking-detail-value">{dateFmt.format(start!)}</p>
              <p className="specialist-booking-detail-value">
                {timeFmt.format(start!)} – {timeFmt.format(end!)} ·{' '}
                {t('agenda.min', { count: b.durationMinutes })}
              </p>
            </section>

            <section
              className="specialist-booking-detail-section"
              aria-label={t('sessionDetail.specialist')}
            >
              <h2 className="specialist-booking-detail-h2">{t('sessionDetail.specialist')}</h2>
              <p className="specialist-booking-detail-value">{b.specialistName}</p>
            </section>
          </>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
