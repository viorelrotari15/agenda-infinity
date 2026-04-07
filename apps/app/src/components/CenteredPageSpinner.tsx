import { IonSpinner } from '@ionic/react';

export type CenteredPageSpinnerProps = {
  className?: string;
  color?: string;
};

export function CenteredPageSpinner({
  className = 'discover-page__loading',
  color,
}: CenteredPageSpinnerProps) {
  return (
    <div className={className}>
      <IonSpinner name="crescent" color={color} />
    </div>
  );
}
