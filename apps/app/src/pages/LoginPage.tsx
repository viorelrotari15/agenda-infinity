import {
  IonButton,
  IonContent,
  IonInput,
  IonItem,
  IonList,
  IonNote,
  IonPage,
  IonText,
} from '@ionic/react';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppHeader } from '../components/AppHeader';
import { api } from '../lib/api';
import { setSessionTokens } from '../lib/auth-session';
import { agendaKeys } from '../lib/query-keys';

type FormValues = {
  email: string;
  password: string;
};

export default function LoginPage() {
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      const tokens = await api.login({
        email: values.email.trim(),
        password: values.password,
      });
      setSessionTokens(tokens);
      await queryClient.invalidateQueries({ queryKey: agendaKeys.me() });
      history.push('/tabs/discover');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.signInFailed'));
    }
  });

  return (
    <IonPage>
      <AppHeader title={t('auth.signInTitle')} backHref="/tabs/discover" />
      <IonContent fullscreen className="app-content ion-padding auth-page">
        <div className="auth-panel ui-elevated">
          <IonText>
            <h1 className="auth-heading">{t('auth.welcomeBack')}</h1>
            <p className="auth-sub">{t('auth.signInSub')}</p>
          </IonText>
          <form onSubmit={onSubmit} className="auth-form">
            <IonList lines="none" className="auth-list">
              <IonItem className="auth-item" lines="none">
                <Controller
                  name="email"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <IonInput
                      label={t('auth.email')}
                      labelPlacement="stacked"
                      type="email"
                      autocomplete="email"
                      value={field.value}
                      onIonInput={(e) => field.onChange(e.detail.value ?? '')}
                      onIonBlur={field.onBlur}
                    />
                  )}
                />
              </IonItem>
              <IonItem className="auth-item" lines="none">
                <Controller
                  name="password"
                  control={control}
                  rules={{ required: true }}
                  render={({ field }) => (
                    <IonInput
                      label={t('auth.password')}
                      labelPlacement="stacked"
                      type="password"
                      autocomplete="current-password"
                      value={field.value}
                      onIonInput={(e) => field.onChange(e.detail.value ?? '')}
                      onIonBlur={field.onBlur}
                    />
                  )}
                />
              </IonItem>
            </IonList>
            {error ? (
              <IonNote color="danger" className="auth-error">
                {error}
              </IonNote>
            ) : null}
            <IonButton expand="block" type="submit" disabled={isSubmitting} className="auth-submit">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </IonButton>
            <IonButton fill="clear" expand="block" routerLink="/register">
              {t('auth.createAccount')}
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
}
