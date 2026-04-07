import type { ServiceDto } from '@agenda/shared';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { IonButton, IonItem, IonLabel, IonList, IonNote, IonSelect, IonSelectOption, IonSpinner, IonText } from '@ionic/react';
import { useAvailabilitySlotsQuery } from '../../hooks/queries/useAvailabilitySlotsQuery';
import { getLocaleTag } from '../../i18n/i18n';
import { capSlots, DEFAULT_AVAILABLE_PERIODS_CAP, formatSlotDisplayLines } from '../../lib/availablePeriods';
import { useSelectModalInterface } from '../../hooks/useIsMobileBreakpoint';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

export type SpecialistAvailablePeriodsListProps = {
  specialistId: string;
  services: ServiceDto[];
  onPickSlot: (startIso: string, serviceId: string) => void;
};

export function SpecialistAvailablePeriodsList({
  specialistId,
  services,
  onPickSlot,
}: SpecialistAvailablePeriodsListProps) {
  const { t } = useTranslation();
  const loc = getLocaleTag();
  const selectModal = useSelectModalInterface();

  const [serviceId, setServiceId] = useState<string | null>(null);
  useEffect(() => {
    const first = services.find((s) => s.active)?.id ?? services[0]?.id ?? null;
    setServiceId(first);
  }, [specialistId, services]);

  const activeService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  const q = useAvailabilitySlotsQuery(specialistId, serviceId);

  const rows = useMemo(() => {
    const raw = q.data ?? [];
    return capSlots(raw, DEFAULT_AVAILABLE_PERIODS_CAP);
  }, [q.data]);

  if (!services.length) return null;

  return (
    <Card className="ui-elevated specialist-available-periods">
      <CardHeader>
        <CardTitle>{t('home.availablePeriods.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="specialist-available-periods__sub">{t('home.availablePeriods.subtitle')}</p>

        {services.length > 1 ? (
          <IonItem lines="none" className="specialist-available-periods__service-field">
            <IonLabel position="stacked" className="ui-label">
              {t('home.availablePeriods.serviceLabel')}
            </IonLabel>
            <IonSelect
              key={selectModal ? 'if-modal' : 'if-popover'}
              interface={selectModal ? 'modal' : 'popover'}
              interfaceOptions={
                selectModal
                  ? { header: t('home.availablePeriods.serviceLabel'), cssClass: 'app-select-modal' }
                  : undefined
              }
              className="calendar-tab-service-select"
              value={serviceId ?? ''}
              onIonChange={(e) => setServiceId(String(e.detail.value ?? '') || null)}
            >
              {services.map((s) => (
                <IonSelectOption key={s.id} value={s.id} disabled={!s.active}>
                  {t('home.availablePeriods.serviceOption', {
                    name: s.name,
                    minutes: s.durationMinutes,
                  })}
                </IonSelectOption>
              ))}
            </IonSelect>
          </IonItem>
        ) : activeService ? (
          <IonNote className="specialist-available-periods__service-one">
            {t('home.availablePeriods.serviceOption', {
              name: activeService.name,
              minutes: activeService.durationMinutes,
            })}
          </IonNote>
        ) : null}

        <section
          className="specialist-available-periods__region"
          aria-label={t('home.availablePeriods.ariaLabel')}
          role="region"
        >
          {q.isPending ? (
            <div
              className="specialist-available-periods__loading"
              aria-busy="true"
              aria-label={t('home.availablePeriods.loading')}
            >
              <IonSpinner name="crescent" color="primary" />
            </div>
          ) : q.isError ? (
            <IonText color="danger">
              <p>{t('home.availablePeriods.loadError')}</p>
            </IonText>
          ) : rows.length === 0 ? (
            <IonText color="medium">
              <p>{t('home.availablePeriods.empty')}</p>
            </IonText>
          ) : (
            <IonList lines="none" className="specialist-available-periods__list">
              {rows.map((slot) => {
                const lines = formatSlotDisplayLines(slot, loc);
                return (
                  <IonItem
                    key={slot.start}
                    className="specialist-available-periods__row"
                    lines="none"
                    data-testid="available-period-row"
                    data-start={slot.start}
                  >
                    <IonLabel>
                      <p className="specialist-available-periods__weekday">{lines.weekday}</p>
                      <p className="specialist-available-periods__date">{lines.dateLine}</p>
                      <p className="specialist-available-periods__time">{lines.timeLine}</p>
                    </IonLabel>
                    {serviceId ? (
                      <IonButton
                        slot="end"
                        size="small"
                        shape="round"
                        onClick={() => onPickSlot(slot.start, serviceId)}
                      >
                        {t('home.availablePeriods.pickSlot')}
                      </IonButton>
                    ) : null}
                  </IonItem>
                );
              })}
            </IonList>
          )}
        </section>
      </CardContent>
    </Card>
  );
}
