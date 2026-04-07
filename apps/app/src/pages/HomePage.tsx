import { IonContent, IonPage } from '@ionic/react';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { BookingFormPanel } from '../components/home/BookingFormPanel';
import type { BookingFormValues } from '../components/home/bookingTypes';
import { CalendarTabView } from '../components/home/CalendarTabView';
import { HomeViewSegment } from '../components/home/HomeViewSegment';
import { SpecialistTabView } from '../components/home/SpecialistTabView';
import { useIsMobileBreakpoint } from '../hooks/useIsMobileBreakpoint';
import { useCreateBookingMutation } from '../hooks/queries/useCreateBookingMutation';
import { useBannersQuery } from '../hooks/queries/useBannersQuery';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { useSpecialistServicesQuery } from '../hooks/queries/useSpecialistServicesQuery';
import { useSpecialistsQuery } from '../hooks/queries/useSpecialistsQuery';
import { hasStoredAccessToken } from '../lib/auth-session';
import { agendaKeys } from '../lib/query-keys';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import type { BannerPublic } from '@agenda/shared';
import { getLocaleTag } from '../i18n/i18n';
import { useAppToast } from '../lib/appToast';

export default function HomePage() {
  const { t } = useTranslation();
  const location = useLocation();
  const bookOnlyFlow = new URLSearchParams(location.search).get('bookOnly') === '1';
  const { presentSuccess } = useAppToast();
  const [specialistId, setSpecialistId] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedSlot, setSelectedSlot] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const isMobileViewport = useIsMobileBreakpoint();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [occupiedSlots, setOccupiedSlots] = useState<Array<{ start: string; end: string }>>([]);
  const [serverOccupiedSlots, setServerOccupiedSlots] = useState<
    Array<{ start: string; end: string }>
  >([]);
  const [bookingError, setBookingError] = useState('');
  const [calendarRefreshNonce, setCalendarRefreshNonce] = useState(0);
  const [view, setView] = useState<'specialist' | 'calendar'>(() =>
    bookOnlyFlow ? 'calendar' : 'specialist',
  );
  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    defaultValues: {
      clientName: '',
      clientEmail: '',
      clientPhone: '',
    },
  });
  const clientName = useWatch({ control, name: 'clientName' });
  const clientPhone = useWatch({ control, name: 'clientPhone' });

  const queryClient = useQueryClient();
  const hasStoredToken = hasStoredAccessToken();

  const specialistsQuery = useSpecialistsQuery();
  const specialists = useMemo(() => specialistsQuery.data ?? [], [specialistsQuery.data]);

  const servicesQuery = useSpecialistServicesQuery(specialistId);
  const services = useMemo(() => servicesQuery.data ?? [], [servicesQuery.data]);

  const bannersQuery = useBannersQuery();
  const bannerImageUrls = (bannersQuery.data ?? []).map((b: BannerPublic) => b.imageUrl);

  const meQuery = useMeQuery(hasStoredToken);
  const createBookingMutation = useCreateBookingMutation();

  const bookingCalendarLayoutRef = useRef<HTMLDivElement>(null);
  const [bookingCalendarFillHeight, setBookingCalendarFillHeight] = useState<number | null>(null);

  useEffect(() => {
    if (bookOnlyFlow) setView('calendar');
  }, [bookOnlyFlow]);

  useEffect(() => {
    if (!specialists.length) return;
    const params = new URLSearchParams(location.search);
    const slug = params.get('specialistSlug');
    if (slug) {
      const match = specialists.find((s) => s.slug === slug);
      if (match) {
        setSpecialistId(match.id);
        return;
      }
    }
    setSpecialistId((prev) => prev || specialists[0].id);
  }, [specialists, location.search]);

  useEffect(() => {
    if (!services.length) return;
    if (!services.some((item) => item.id === selectedService)) {
      setSelectedService('');
    }
  }, [services, selectedService]);

  useEffect(() => {
    if (!meQuery.data) return;
    setIsLoggedIn(true);
    setValue('clientEmail', meQuery.data.email, { shouldValidate: true });
    if (meQuery.data.phone) {
      setValue('clientPhone', meQuery.data.phone, { shouldValidate: true });
    }
    if (!clientName) {
      setValue('clientName', meQuery.data.email.split('@')[0], { shouldValidate: true });
    }
  }, [meQuery.data, clientName, setValue]);

  useEffect(() => {
    if (meQuery.isError) setIsLoggedIn(false);
  }, [meQuery.isError]);

  const activeSpecialist = specialists.find((item) => item.id === specialistId) ?? null;
  const specialistPhotos = activeSpecialist
    ? [
        ...bannerImageUrls,
        `https://picsum.photos/seed/${activeSpecialist.slug}-1/1200/800`,
        `https://picsum.photos/seed/${activeSpecialist.slug}-2/1200/800`,
        `https://picsum.photos/seed/${activeSpecialist.slug}-3/1200/800`,
        `https://picsum.photos/seed/${activeSpecialist.slug}-4/1200/800`,
      ]
    : bannerImageUrls;

  useEffect(() => {
    setOccupiedSlots([]);
  }, [specialistId, selectedService]);

  useEffect(() => {
    setServerOccupiedSlots([]);
  }, [specialistId]);

  const canConfirm = isLoggedIn
    ? Boolean(selectedSlot && selectedService && specialistId)
    : Boolean(
        selectedSlot && selectedService && specialistId && clientName.trim() && clientPhone.trim(),
      );

  const selectedServiceDetails = services.find((item) => item.id === selectedService) ?? null;

  useLayoutEffect(() => {
    if (view !== 'calendar' || !selectedServiceDetails) {
      setBookingCalendarFillHeight(null);
      return;
    }

    const el = bookingCalendarLayoutRef.current;
    if (!el) return;

    const update = () => {
      const top = el.getBoundingClientRect().top;
      setBookingCalendarFillHeight(Math.max(280, window.innerHeight - top - 16));
    };

    update();
    const ro = new ResizeObserver(() => update());
    ro.observe(document.documentElement);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [view, selectedServiceDetails]);

  const showDesktopBookingForm = !isMobileViewport && Boolean(selectedSlot);
  const bookingEndIso =
    selectedSlot && selectedServiceDetails
      ? new Date(
          new Date(selectedSlot).getTime() + selectedServiceDetails.durationMinutes * 60 * 1000,
        ).toISOString()
      : '';

  useEffect(() => {
    // If the desktop booking form sidebar is visible, let the layout grow naturally to fit its content.
    // A forced height clips the form fields.
    if (showDesktopBookingForm) setBookingCalendarFillHeight(null);
  }, [showDesktopBookingForm]);

  const bookingSlotSummary = useMemo(() => {
    if (!selectedSlot) return null;
    const start = new Date(selectedSlot);
    const end = bookingEndIso ? new Date(bookingEndIso) : null;
    const loc = getLocaleTag();
    const weekdayFmt = new Intl.DateTimeFormat(loc, { weekday: 'long' });
    const dateFmt = new Intl.DateTimeFormat(loc, {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    const timeFmt = new Intl.DateTimeFormat(loc, {
      hour: 'numeric',
      minute: '2-digit',
    });
    const weekday = weekdayFmt.format(start);
    const dateLine = dateFmt.format(start);
    const startTime = timeFmt.format(start);
    const endTime = end ? timeFmt.format(end) : null;
    const timeLine = endTime ? `${startTime} – ${endTime}` : startTime;
    const durationMin = selectedServiceDetails?.durationMinutes;
    return { weekday, dateLine, timeLine, durationMin };
  }, [selectedSlot, bookingEndIso, selectedServiceDetails]);

  const mergedOccupiedForConflict = [...occupiedSlots, ...serverOccupiedSlots];
  const hasPeriodConflict = Boolean(
    selectedSlot &&
    bookingEndIso &&
    mergedOccupiedForConflict.some((slot) => {
      const selectedStartMs = new Date(selectedSlot).getTime();
      const selectedEndMs = new Date(bookingEndIso).getTime();
      const occupiedStartMs = new Date(slot.start).getTime();
      const occupiedEndMs = new Date(slot.end).getTime();
      return selectedStartMs < occupiedEndMs && selectedEndMs > occupiedStartMs;
    }),
  );

  const openBookingModal = (isoStart: string) => {
    setSelectedSlot(isoStart);
    setBookingError('');
    if (isMobileViewport) {
      setIsBookingModalOpen(true);
    }
  };

  const pickAvailableSlotFromList = (startIso: string, serviceId: string) => {
    setSelectedService(serviceId);
    setBookingError('');
    setSelectedSlot(startIso);
    setView('calendar');
    if (isMobileViewport) {
      setIsBookingModalOpen(true);
    }
  };

  const selectServiceAndGoToCalendar = (serviceId: string) => {
    setSelectedService(serviceId);
    setView('calendar');
  };

  const submitBooking = handleSubmit(async (formValues) => {
    if (hasPeriodConflict || !bookingEndIso) {
      setBookingError('This date/time period is already occupied. Please pick another slot.');
      return;
    }
    setBookingError('');
    try {
      await createBookingMutation.mutateAsync({
        specialistId,
        serviceId: selectedService,
        startUtc: selectedSlot,
        clientName: formValues.clientName || undefined,
        clientEmail: formValues.clientEmail || undefined,
        clientPhone: isLoggedIn ? undefined : formValues.clientPhone,
      });
      await queryClient.invalidateQueries({
        queryKey: [...agendaKeys.all, 'occupied'],
      });
      await queryClient.invalidateQueries({
        queryKey: [...agendaKeys.all, 'availability'],
      });
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : t('home.bookingFailed'));
      setCalendarRefreshNonce((prev) => prev + 1);
      return;
    }

    const startDate = new Date(selectedSlot);
    setOccupiedSlots((prev) => [
      ...prev,
      {
        start: startDate.toISOString(),
        end: bookingEndIso,
      },
    ]);
    setCalendarRefreshNonce((prev) => prev + 1);

    setIsBookingModalOpen(false);
    presentSuccess(t('home.bookingConfirmed'), 2800);
  });

  const bookingFormPanel = (
    <BookingFormPanel
      bookingSlotSummary={bookingSlotSummary}
      isLoggedIn={isLoggedIn}
      register={register}
      errors={errors}
      hasPeriodConflict={hasPeriodConflict}
      bookingError={bookingError}
      canConfirm={canConfirm}
      isSubmitting={isSubmitting}
      isMutationPending={createBookingMutation.isPending}
      isMobileViewport={isMobileViewport}
      onSubmit={submitBooking}
      onCloseMobile={() => setIsBookingModalOpen(false)}
    />
  );

  return (
    <IonPage>
      <AppHeader
        title={t('home.title')}
        backHref={bookOnlyFlow ? '/tabs/discover' : undefined}
        backText={bookOnlyFlow ? t('home.backToDiscover') : undefined}
      />
      <IonContent fullscreen className="app-content ion-padding">
        <div className="home-page-shell">
          {!bookOnlyFlow ? <HomeViewSegment value={view} onChange={setView} /> : null}

          {bookOnlyFlow || view === 'calendar' ? (
            <CalendarTabView
              services={services}
              selectedService={selectedService}
              onSelectedServiceChange={setSelectedService}
              selectedServiceDetails={selectedServiceDetails}
              onChangeServiceView={bookOnlyFlow ? () => {} : () => setView('specialist')}
              bookingCalendarLayoutRef={bookingCalendarLayoutRef}
              showDesktopBookingForm={showDesktopBookingForm}
              bookingCalendarFillHeight={bookingCalendarFillHeight}
              bookingSidebar={bookingFormPanel}
              specialistId={specialistId}
              occupiedSlots={occupiedSlots}
              selectedSlot={selectedSlot}
              bookingEndIso={bookingEndIso}
              calendarRefreshNonce={calendarRefreshNonce}
              onSelectSlot={openBookingModal}
              onServerOccupiedSlotsChange={setServerOccupiedSlots}
              isMobileViewport={isMobileViewport}
              isBookingModalOpen={isBookingModalOpen}
              onBookingModalDismiss={() => setIsBookingModalOpen(false)}
              bookingFormModalContent={bookingFormPanel}
            />
          ) : (
            <SpecialistTabView
              specialistsQuery={specialistsQuery}
              specialistId={specialistId}
              activeSpecialist={activeSpecialist}
              specialistPhotos={specialistPhotos}
              services={services}
              isMobileViewport={isMobileViewport}
              selectedService={selectedService}
              onSelectServiceAndGoToCalendar={selectServiceAndGoToCalendar}
              onPickAvailableSlot={pickAvailableSlotFromList}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
