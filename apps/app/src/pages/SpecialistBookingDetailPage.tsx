import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookingStatusClass, bookingStatusLabel } from '../components/agenda/bookingStatusUi';
import { api } from '../lib/api';
import { hasStoredAccessToken } from '../lib/auth-session';
import { agendaKeys } from '../lib/query-keys';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { getLocaleTag } from '../i18n/i18n';
import { useAppToast } from '../lib/appToast';

export default function SpecialistBookingDetailPage() {
  const { t } = useTranslation();
  const loc = getLocaleTag();
  const { id } = useParams<{ id: string }>();
  const { presentInfo, presentDanger } = useAppToast();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  const q = useQuery({
    queryKey: agendaKeys.specialistBooking(id ?? ''),
    queryFn: () => api.specialistBooking(id!),
    enabled: Boolean(id) && me?.role === 'SPECIALIST',
  });

  const decisionMut = useMutation({
    mutationFn: (decision: 'accept' | 'deny') => api.specialistBookingDecision(id!, decision),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: agendaKeys.all });
      presentInfo(t('sessionDetail.toastUpdated'), 2800);
      await q.refetch();
    },
    onError: (err: Error) => {
      presentDanger(err.message || t('sessionDetail.toastError'), 3400);
    },
  });

  if (meQuery.isPending) {
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
          <IonSpinner name="crescent" />
        </IonContent>
      </IonPage>
    );
  }

  if (me?.role !== 'SPECIALIST') {
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
          <IonText color="medium">
            <p>{t('sessionDetail.specialistRequired')}</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

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
          <div className="specialist-booking-detail-loading">
            <IonSpinner name="crescent" />
          </div>
        ) : q.isError ? (
          <IonText color="danger">
            <p>{q.error instanceof Error ? q.error.message : t('sessionDetail.loadError')}</p>
          </IonText>
        ) : b ? (
          <>
            <div className="specialist-booking-detail-hero">
              <span className={bookingStatusClass(b.status)}>{bookingStatusLabel(b.status)}</span>
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
              aria-label={t('sessionDetail.client')}
            >
              <h2 className="specialist-booking-detail-h2">{t('sessionDetail.client')}</h2>
              <p className="specialist-booking-detail-value">{b.clientName}</p>
              <p className="specialist-booking-detail-value">
                <a href={`mailto:${b.clientEmail}`}>{b.clientEmail}</a>
              </p>
              {b.clientPhone ? (
                <p className="specialist-booking-detail-value">
                  <a href={`tel:${b.clientPhone}`}>{b.clientPhone}</a>
                </p>
              ) : (
                <IonText color="medium">
                  <p className="specialist-booking-detail-muted">{t('sessionDetail.noPhone')}</p>
                </IonText>
              )}
            </section>

            {b.status === 'CREATED' ? (
              <div className="specialist-booking-detail-actions">
                <IonButton
                  expand="block"
                  color="success"
                  disabled={decisionMut.isPending}
                  onClick={() => decisionMut.mutate('accept')}
                >
                  {t('sessionDetail.accept')}
                </IonButton>
                <IonButton
                  expand="block"
                  color="medium"
                  fill="outline"
                  disabled={decisionMut.isPending}
                  onClick={() => decisionMut.mutate('deny')}
                >
                  {t('sessionDetail.decline')}
                </IonButton>
                <IonText color="medium">
                  <p className="specialist-booking-detail-hint">
                    {t('sessionDetail.notificationsHint')}
                  </p>
                </IonText>
              </div>
            ) : null}
          </>
        ) : null}
      </IonContent>
    </IonPage>
  );
}
