import { fireEvent, render } from '@testing-library/react';
import type { ServiceDto } from '@agenda/shared';
import i18n from 'i18next';
import { createRef, type ComponentProps } from 'react';
import { initReactI18next, I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';
import { CalendarTabView } from './CalendarTabView';

const services: ServiceDto[] = [
  {
    id: 'svc-a',
    name: 'Consult',
    durationMinutes: 30,
    bufferMinutes: 0,
    active: true,
    serviceTypeId: null,
  },
  {
    id: 'svc-b',
    name: 'Follow-up',
    durationMinutes: 45,
    bufferMinutes: 5,
    active: true,
    serviceTypeId: null,
  },
];

async function createTestI18n() {
  const instance = i18n.createInstance();
  await instance.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          'calendarTab.chooseService': 'Choose service',
          'calendarTab.serviceLabel': 'Service',
          'calendarTab.selectServiceOption': 'Select a service',
          'calendarTab.serviceOption': '{{name}} ({{minutes}} min)',
          'calendarTab.selectServiceFirst': 'Pick a service first',
          'calendarTab.selectedService': 'Selected service',
          'calendarTab.minutes': 'minutes',
          'calendarTab.changeService': 'Change',
          'calendarTab.loadingCalendar': 'Loading calendar',
          'calendarTab.modalTitle': 'Booking',
        },
      },
    },
    interpolation: { escapeValue: false },
  });
  return instance;
}

type ViewProps = ComponentProps<typeof CalendarTabView>;

function buildProps(
  overrides: Partial<ViewProps> = {},
  onSelectedServiceChange: (id: string) => void = vi.fn(),
): ViewProps {
  return {
    services,
    selectedService: '',
    onSelectedServiceChange,
    selectedServiceDetails: null,
    onChangeServiceView: vi.fn(),
    bookingCalendarLayoutRef: createRef<HTMLDivElement>(),
    showDesktopBookingForm: false,
    bookingCalendarFillHeight: null,
    bookingSidebar: null,
    specialistId: 'spec-1',
    occupiedSlots: [],
    selectedSlot: '',
    bookingEndIso: '',
    calendarRefreshNonce: 0,
    onSelectSlot: vi.fn(),
    onServerOccupiedSlotsChange: vi.fn(),
    isMobileViewport: false,
    isBookingModalOpen: false,
    onBookingModalDismiss: vi.fn(),
    bookingFormModalContent: null,
    ...overrides,
  };
}

describe('CalendarTabView', () => {
  it('uses ion-select with an option per service plus the empty option', async () => {
    const testI18n = await createTestI18n();
    const { container } = render(
      <I18nextProvider i18n={testI18n}>
        <CalendarTabView {...buildProps()} />
      </I18nextProvider>,
    );

    expect(container.querySelector('ion-select')).toBeTruthy();
    expect(container.querySelectorAll('ion-select-option')).toHaveLength(1 + services.length);
  });

  it('calls onSelectedServiceChange when ion-select emits ionChange', async () => {
    const testI18n = await createTestI18n();
    const onSelectedServiceChange = vi.fn();
    const { container } = render(
      <I18nextProvider i18n={testI18n}>
        <CalendarTabView {...buildProps({}, onSelectedServiceChange)} />
      </I18nextProvider>,
    );

    const ionSelect = container.querySelector('ion-select');
    expect(ionSelect).toBeTruthy();
    fireEvent(
      ionSelect!,
      new CustomEvent('ionChange', { detail: { value: 'svc-a' }, bubbles: true, composed: true }),
    );

    expect(onSelectedServiceChange).toHaveBeenCalledWith('svc-a');
  });
});
