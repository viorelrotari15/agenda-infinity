import { lazy, Suspense, type ReactNode, type RefObject } from 'react';
import type { ServiceDto } from '@agenda/shared';
import { useTranslation } from 'react-i18next';
import { useSelectModalInterface } from '../../hooks/useIsMobileBreakpoint';
import {
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const BookingCalendar = lazy(() => import('../BookingCalendar'));

type Props = {
  services: ServiceDto[];
  selectedService: string;
  onSelectedServiceChange: (serviceId: string) => void;
  selectedServiceDetails: ServiceDto | null;
  onChangeServiceView: () => void;
  bookingCalendarLayoutRef: RefObject<HTMLDivElement>;
  showDesktopBookingForm: boolean;
  bookingCalendarFillHeight: number | null;
  bookingSidebar: ReactNode;
  specialistId: string;
  occupiedSlots: Array<{ start: string; end: string }>;
  selectedSlot: string;
  bookingEndIso: string;
  calendarRefreshNonce: number;
  onSelectSlot: (isoStart: string) => void;
  onServerOccupiedSlotsChange: (slots: Array<{ start: string; end: string }>) => void;
  isMobileViewport: boolean;
  isBookingModalOpen: boolean;
  onBookingModalDismiss: () => void;
  bookingFormModalContent: ReactNode;
};

export function CalendarTabView({
  services,
  selectedService,
  onSelectedServiceChange,
  selectedServiceDetails,
  onChangeServiceView,
  bookingCalendarLayoutRef,
  showDesktopBookingForm,
  bookingCalendarFillHeight,
  bookingSidebar,
  specialistId,
  occupiedSlots,
  selectedSlot,
  bookingEndIso,
  calendarRefreshNonce,
  onSelectSlot,
  onServerOccupiedSlotsChange,
  isMobileViewport,
  isBookingModalOpen,
  onBookingModalDismiss,
  bookingFormModalContent,
}: Props) {
  const { t } = useTranslation();
  const selectModal = useSelectModalInterface();
  return (
    <>
      <div className="home-section-stack">
        {!selectedServiceDetails ? (
          <IonText color="medium">
            <p>{t('calendarTab.selectServiceFirst')}</p>
          </IonText>
        ) : (
          <Card className="ui-elevated">
            <CardHeader>
              <CardTitle>{t('calendarTab.selectedService')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>
                <strong>{selectedServiceDetails.name}</strong> -{' '}
                {selectedServiceDetails.durationMinutes} {t('calendarTab.minutes')}
              </p>
              <div className="ui-actions">
                <Button variant="ghost" onClick={onChangeServiceView}>
                  {t('calendarTab.changeService')}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="ui-elevated">
          <CardHeader>
            <CardTitle>{t('calendarTab.chooseService')}</CardTitle>
          </CardHeader>
          <CardContent>
            <IonItem lines="none" className="calendar-tab-service-field">
              <IonLabel position="stacked" className="ui-label">
                {t('calendarTab.serviceLabel')}
              </IonLabel>
              <IonSelect
                key={selectModal ? 'if-modal' : 'if-popover'}
                interface={selectModal ? 'modal' : 'popover'}
                interfaceOptions={
                  selectModal
                    ? { header: t('calendarTab.chooseService'), cssClass: 'app-select-modal' }
                    : undefined
                }
                className="calendar-tab-service-select"
                value={selectedService}
                onIonChange={(e) => onSelectedServiceChange(String(e.detail.value ?? ''))}
              >
                <IonSelectOption value="">{t('calendarTab.selectServiceOption')}</IonSelectOption>
                {services.map((service) => (
                  <IonSelectOption key={service.id} value={service.id}>
                    {t('calendarTab.serviceOption', {
                      name: service.name,
                      minutes: service.durationMinutes,
                    })}
                  </IonSelectOption>
                ))}
              </IonSelect>
            </IonItem>
          </CardContent>
        </Card>

        {selectedServiceDetails ? (
          <div
            ref={bookingCalendarLayoutRef}
            className={`booking-calendar-layout ${
              showDesktopBookingForm
                ? 'booking-calendar-layout-with-form'
                : 'booking-calendar-layout-full'
            }`}
            style={
              bookingCalendarFillHeight != null ? { height: bookingCalendarFillHeight } : undefined
            }
          >
            {showDesktopBookingForm ? (
              <div className="booking-sidebar">{bookingSidebar}</div>
            ) : null}
            <div className="booking-calendar-column">
              <Suspense
                fallback={
                  <div
                    className="calendar-suspense-fallback"
                    aria-busy="true"
                    aria-label={t('calendarTab.loadingCalendar')}
                  >
                    <IonSpinner name="crescent" color="primary" />
                  </div>
                }
              >
                <BookingCalendar
                  specialistId={specialistId}
                  serviceId={selectedService}
                  occupiedSlots={occupiedSlots}
                  selectedStart={selectedSlot || undefined}
                  selectedEnd={bookingEndIso || undefined}
                  refreshNonce={calendarRefreshNonce}
                  onSelectSlot={onSelectSlot}
                  onServerOccupiedSlotsChange={onServerOccupiedSlotsChange}
                />
              </Suspense>
            </div>
          </div>
        ) : null}
      </div>

      <IonModal
        isOpen={isMobileViewport && isBookingModalOpen}
        onDidDismiss={onBookingModalDismiss}
        className="booking-modal-mobile"
        breakpoints={[0, 0.5, 0.85]}
        initialBreakpoint={0.85}
        backdropBreakpoint={0.5}
      >
        <IonHeader>
          <IonToolbar>
            <IonTitle>{t('calendarTab.modalTitle')}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">{bookingFormModalContent}</IonContent>
      </IonModal>
    </>
  );
}
