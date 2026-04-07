import { IonContent, IonPage } from '@ionic/react';
import { AppHeader } from './AppHeader';
import { CenteredPageSpinner } from './CenteredPageSpinner';

export type AppHeaderPageLoadingProps = {
  title: string;
};

export function AppHeaderPageLoading({ title }: AppHeaderPageLoadingProps) {
  return (
    <IonPage>
      <AppHeader title={title} />
      <IonContent className="ion-padding">
        <CenteredPageSpinner />
      </IonContent>
    </IonPage>
  );
}
