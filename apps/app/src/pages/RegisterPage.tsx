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
import { createClientAccount } from '../lib/api';
import { agendaKeys } from '../lib/query-keys';

type FormValues = {
  email: string;
  phone: string;
  password: string;
};

export default function RegisterPage() {
  const { t } = useTranslation();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({ defaultValues: { email: '', phone: '', password: '' } });

  const onSubmit = handleSubmit(async (values) => {
    setError('');
    try {
      await createClientAccount({
        email: values.email.trim(),
        phone: values.phone.trim(),
        password: values.password,
      });
      await queryClient.invalidateQueries({ queryKey: agendaKeys.me() });
      history.push('/tabs/book');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('auth.registrationFailed'));
    }
  });

  return (
    <IonPage>
      <AppHeader title={t('auth.registerTitle')} />
      <IonContent fullscreen className="app-content ion-padding auth-page">
        <div className="auth-panel ui-elevated">
          <IonText>
            <h1 className="auth-heading">{t('auth.registerHeading')}</h1>
            <p className="auth-sub">{t('auth.registerSub')}</p>
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
                  name="phone"
                  control={control}
                  rules={{ required: true, minLength: 8 }}
                  render={({ field }) => (
                    <IonInput
                      label="Phone"
                      labelPlacement="stacked"
                      type="tel"
                      autocomplete="tel"
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
                  rules={{ required: true, minLength: 8 }}
                  render={({ field }) => (
                    <IonInput
                      label={t('auth.password')}
                      labelPlacement="stacked"
                      type="password"
                      autocomplete="new-password"
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
              {isSubmitting ? t('auth.creating') : t('auth.createAccountCta')}
            </IonButton>
            <IonButton fill="clear" expand="block" routerLink="/login">
              {t('auth.haveAccount')}
            </IonButton>
          </form>
        </div>
      </IonContent>
    </IonPage>
  );
}
