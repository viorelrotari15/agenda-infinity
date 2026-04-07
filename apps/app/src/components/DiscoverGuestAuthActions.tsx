import { IonButton } from '@ionic/react';

export type DiscoverGuestAuthActionsProps = {
  signInLabel: string;
  createAccountLabel: string;
};

export function DiscoverGuestAuthActions({
  signInLabel,
  createAccountLabel,
}: DiscoverGuestAuthActionsProps) {
  return (
    <div className="discover-page__auth">
      <IonButton routerLink="/login" fill="outline" size="small">
        {signInLabel}
      </IonButton>
      <IonButton routerLink="/register" size="small">
        {createAccountLabel}
      </IonButton>
    </div>
  );
}
