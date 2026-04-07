import {
  IonAvatar,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonChip,
  IonLabel,
  IonRouterLink,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import type { SpecialistDirectoryEntry } from '@agenda/shared';
import { RatingStars } from './RatingStars';

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase();
}

export function SpecialistDirectoryCard({
  specialist,
  onOpen,
  /** When true (e.g. user found this row via search), book opens in calendar-only mode with a slim tab bar. */
  bookOnly = false,
}: {
  specialist: SpecialistDirectoryEntry;
  onOpen?: () => void;
  bookOnly?: boolean;
}) {
  const { t } = useTranslation();
  const qs = new URLSearchParams({ specialistSlug: specialist.slug });
  if (bookOnly) qs.set('bookOnly', '1');
  const href = `/tabs/book?${qs.toString()}`;
  const photo = specialist.publicPhotoUrl?.trim();

  return (
    <IonCard className="specialist-dir-card">
      <div className="specialist-dir-card__row">
        <div className="specialist-dir-card__media">
          <IonAvatar className="specialist-dir-card__avatar">
            {photo ? (
              <img
                src={photo}
                alt=""
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="specialist-dir-card__avatar-initials" aria-hidden>
                {initialsFromName(specialist.displayName)}
              </span>
            )}
          </IonAvatar>
        </div>
        <div className="specialist-dir-card__main">
          <IonCardHeader>
            <IonCardTitle className="specialist-dir-card__title">
              <IonRouterLink
                routerLink={href}
                className="specialist-dir-card__link"
                onClick={() => onOpen?.()}
              >
                {specialist.displayName}
              </IonRouterLink>
            </IonCardTitle>
            <div className="specialist-dir-card__rating">
              <RatingStars value={specialist.averageRating} />
              <span className="specialist-dir-card__rating-text">
                {specialist.averageRating.toFixed(1)} ·{' '}
                {t('directory.reviewCount', { count: specialist.reviewCount })}
              </span>
            </div>
          </IonCardHeader>
          <IonCardContent>
            {specialist.categories.length > 0 ? (
              <div className="specialist-dir-card__chips">
                {specialist.categories.map((c) => (
                  <IonChip key={c.id} outline className="specialist-dir-card__chip">
                    <IonLabel>{c.name}</IonLabel>
                  </IonChip>
                ))}
              </div>
            ) : null}
            {specialist.sampleServices.length > 0 ? (
              <p className="specialist-dir-card__services">
                {t('directory.sampleServices')}{' '}
                {specialist.sampleServices.map((s) => s.name).join(', ')}
              </p>
            ) : null}
            {specialist.publicBio ? (
              <p className="specialist-dir-card__bio">{specialist.publicBio}</p>
            ) : null}
            <IonRouterLink
              routerLink={href}
              className="specialist-dir-card__cta"
              onClick={() => onOpen?.()}
            >
              {t('directory.bookCta')}
            </IonRouterLink>
          </IonCardContent>
        </div>
      </div>
    </IonCard>
  );
}
