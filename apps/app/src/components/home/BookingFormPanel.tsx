import { IonIcon } from '@ionic/react';

import { calendarOutline } from 'ionicons/icons';

import type { FieldErrors, UseFormRegister } from 'react-hook-form';

import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';

import { Input } from '../ui/input';

import { Badge } from '../ui/badge';

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

import type { BookingFormValues, BookingSlotSummary } from './bookingTypes';

type Props = {
  bookingSlotSummary: BookingSlotSummary | null;

  isLoggedIn: boolean;

  register: UseFormRegister<BookingFormValues>;

  errors: FieldErrors<BookingFormValues>;

  hasPeriodConflict: boolean;

  bookingError: string;

  canConfirm: boolean;

  isSubmitting: boolean;

  isMutationPending: boolean;

  isMobileViewport: boolean;

  onSubmit: () => void;

  onCloseMobile: () => void;
};

export function BookingFormPanel({
  bookingSlotSummary,

  isLoggedIn,

  register,

  errors,

  hasPeriodConflict,

  bookingError,

  canConfirm,

  isSubmitting,

  isMutationPending,

  isMobileViewport,

  onSubmit,

  onCloseMobile,
}: Props) {
  const { t } = useTranslation();

  return (
    <Card className="ui-elevated booking-form-panel">
      <CardHeader>
        <CardTitle>{t('bookingForm.title')}</CardTitle>
      </CardHeader>

      <CardContent>
        {bookingSlotSummary ? (
          <div className="booking-slot-summary">
            <div className="booking-slot-summary-icon" aria-hidden="true">
              <IonIcon icon={calendarOutline} />
            </div>

            <div className="booking-slot-summary-body">
              <p className="booking-slot-summary-eyebrow">{t('bookingForm.eyebrow')}</p>

              <p className="booking-slot-summary-weekday">{bookingSlotSummary.weekday}</p>

              <p className="booking-slot-summary-date">{bookingSlotSummary.dateLine}</p>

              <p className="booking-slot-summary-time">{bookingSlotSummary.timeLine}</p>

              {bookingSlotSummary.durationMin != null ? (
                <div className="booking-slot-summary-meta">
                  <span className="booking-slot-duration-pill">
                    {t('bookingForm.sessionMinutes', {
                      count: bookingSlotSummary.durationMin,
                    })}
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <p className="booking-slot-empty">{t('bookingForm.pickTime')}</p>
        )}

        {isLoggedIn ? (
          <div className="booking-logged-badge-wrap">
            <Badge>{t('bookingForm.loggedIn')}</Badge>
          </div>
        ) : (
          <div className="booking-guest-hint" role="note">
            <span className="booking-guest-hint-title">{t('bookingForm.guestTitle')}</span>

            <ul className="booking-guest-hint-rows">
              <li>
                <span className="booking-guest-hint-tag">{t('bookingForm.guestRequired')}</span>

                <span>{t('bookingForm.guestNamePhone')}</span>
              </li>

              <li>
                <span className="booking-guest-hint-tag">{t('bookingForm.guestOptional')}</span>

                <span>{t('bookingForm.guestEmailOpt')}</span>
              </li>
            </ul>
          </div>
        )}

        <div className="ui-form-grid">
          <label className="ui-label">
            {isLoggedIn ? t('bookingForm.nameOptional') : t('bookingForm.nameRequired')}
          </label>

          <Input
            placeholder={t('bookingForm.namePlaceholder')}
            {...register('clientName', {
              validate: (value) =>
                isLoggedIn || value.trim().length > 0 || t('bookingForm.nameRequiredError'),
            })}
          />

          {errors.clientName ? <p className="ui-error">{errors.clientName.message}</p> : null}

          {!isLoggedIn ? (
            <>
              <label className="ui-label">{t('bookingForm.phoneRequired')}</label>

              <Input
                placeholder={t('bookingForm.phonePlaceholder')}
                {...register('clientPhone', {
                  validate: (value) =>
                    value.trim().length > 0 || t('bookingForm.phoneRequiredError'),
                })}
              />

              {errors.clientPhone ? <p className="ui-error">{errors.clientPhone.message}</p> : null}

              <label className="ui-label">{t('bookingForm.emailOptional')}</label>

              <Input
                placeholder="name@example.com"
                {...register('clientEmail', {
                  validate: (value) => {
                    if (!value) return true;

                    return /\S+@\S+\.\S+/.test(value) || t('bookingForm.emailInvalid');
                  },
                })}
              />

              {errors.clientEmail ? <p className="ui-error">{errors.clientEmail.message}</p> : null}
            </>
          ) : null}
        </div>

        {hasPeriodConflict ? <p className="ui-error">{t('bookingForm.slotConflict')}</p> : null}

        {bookingError ? <p className="ui-error">{bookingError}</p> : null}

        <div className="ui-actions booking-form-actions">
          <Button
            disabled={!canConfirm || hasPeriodConflict || isSubmitting || isMutationPending}
            onClick={onSubmit}
          >
            {isSubmitting || isMutationPending
              ? t('bookingForm.confirming')
              : t('bookingForm.confirm')}
          </Button>

          {isMobileViewport ? (
            <Button variant="ghost" onClick={onCloseMobile}>
              {t('bookingForm.close')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
