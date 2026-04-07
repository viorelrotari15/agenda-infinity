import { IonIcon } from '@ionic/react';
import { star, starOutline } from 'ionicons/icons';

export function RatingStars({
  value,
  max = 5,
  size = 16,
}: {
  value: number;
  max?: number;
  size?: number;
}) {
  const full = Math.round(value);
  const stars = Array.from({ length: max }, (_, i) => (i < full ? star : starOutline));
  return (
    <span className="rating-stars" aria-label={`${value.toFixed(1)} of ${max}`}>
      {stars.map((icon, i) => (
        <IonIcon
          key={i}
          icon={icon}
          style={{ width: size, height: size }}
          className="rating-stars__icon"
        />
      ))}
    </span>
  );
}
