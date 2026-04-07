import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonCheckbox,
  IonContent,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonNote,
  IonPage,
  IonSelect,
  IonSelectOption,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { SpecialistWorkPanel } from '../components/settings/SpecialistWorkPanel';
import { PillSegmentedControl } from '../components/PillSegmentedControl';
import { api } from '../lib/api';
import { clearSession, hasStoredAccessToken } from '../lib/auth-session';
import { useSelectModalInterface } from '../hooks/useIsMobileBreakpoint';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { agendaKeys } from '../lib/query-keys';
import i18n from '../i18n/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();
  const selectModal = useSelectModalInterface();
  const queryClient = useQueryClient();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  const logout = () => {
    clearSession();
    queryClient.removeQueries({ queryKey: agendaKeys.me() });
    window.location.assign('/tabs/discover');
  };

  const [section, setSection] = useState<'account' | 'work'>('account');
  const [phoneDraft, setPhoneDraft] = useState('');
  const [publicBioDraft, setPublicBioDraft] = useState('');
  const [seoTitleDraft, setSeoTitleDraft] = useState('');

  useEffect(() => {
    if (me?.phone) setPhoneDraft(me.phone);
    else setPhoneDraft('');
  }, [me?.phone]);

  useEffect(() => {
    if (!me?.specialistProfile) return;
    setPublicBioDraft(me.specialistProfile.publicBio ?? '');
    setSeoTitleDraft(me.specialistProfile.seoTitle ?? '');
  }, [me?.specialistProfile]);

  const profileMutation = useMutation({
    mutationFn: () => {
      const phone = phoneDraft.trim() || undefined;
      if (me?.role === 'SPECIALIST') {
        return api.patchProfile({
          phone,
          publicBio: publicBioDraft.trim() ? publicBioDraft.trim() : null,
          seoTitle: seoTitleDraft.trim() ? seoTitleDraft.trim() : null,
        });
      }
      return api.patchProfile({ phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.me() });
    },
  });

  const categoriesQuery = useQuery({
    queryKey: agendaKeys.publicCategories(),
    queryFn: () => api.listPublicCategories(),
    enabled: me?.role === 'CLIENT',
  });

  const [interestIds, setInterestIds] = useState<string[]>([]);
  useEffect(() => {
    if (me?.role === 'CLIENT' && me.interestCategoryIds) {
      setInterestIds(me.interestCategoryIds);
    }
  }, [me?.role, me?.interestCategoryIds]);

  const saveInterestsMutation = useMutation({
    mutationFn: () => api.setClientInterests(interestIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.me() });
      queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    },
  });

  return (
    <IonPage>
      <AppHeader title={t('settings.title')} />
      <IonContent fullscreen className="app-content ion-padding settings-page">
        <div className="settings-shell">
          <header className="settings-hero">
            <h1 className="settings-title">{t('settings.heroTitle')}</h1>
            <p className="settings-sub">{t('settings.heroSub')}</p>
          </header>

          <PillSegmentedControl
            value={section}
            onChange={setSection}
            options={[
              { value: 'account', label: t('settings.segmentAccount') },
              {
                value: 'work',
                label: t('settings.segmentSpecialist'),
                disabled: me?.role !== 'SPECIALIST',
              },
            ]}
          />

          {section === 'account' ? (
            <section className="settings-section">
              {!me ? (
                <IonCard className="ion-no-margin">
                  <IonCardContent>
                    <IonButton expand="block" routerLink="/login">
                      {t('settings.signIn')}
                    </IonButton>
                    <IonButton expand="block" fill="clear" routerLink="/register">
                      {t('settings.createClient')}
                    </IonButton>
                  </IonCardContent>
                </IonCard>
              ) : (
                <>
                  <div className="settings-block settings-block--glass">
                    <IonList lines="none" className="settings-list">
                      <IonItem lines="none" className="settings-item">
                        <IonLabel>
                          <p className="settings-label">{t('settings.email')}</p>
                          <p>{me.email}</p>
                        </IonLabel>
                      </IonItem>
                      <IonItem lines="none" className="settings-item settings-item--field">
                        <IonInput
                          label={t('settings.phone')}
                          labelPlacement="stacked"
                          value={phoneDraft}
                          onIonInput={(e) => setPhoneDraft(String(e.detail.value ?? ''))}
                          type="tel"
                        />
                      </IonItem>
                      <IonItem lines="none" className="settings-item settings-item--field">
                        <IonLabel position="stacked">{t('settings.language')}</IonLabel>
                        <IonSelect
                          key={selectModal ? 'if-modal' : 'if-popover'}
                          interface={selectModal ? 'modal' : 'popover'}
                          interfaceOptions={
                            selectModal
                              ? { header: t('settings.language'), cssClass: 'app-select-modal' }
                              : undefined
                          }
                          value={(i18n.resolvedLanguage ?? i18n.language ?? 'en').split('-')[0]}
                          onIonChange={(e) => void i18n.changeLanguage(String(e.detail.value))}
                        >
                          <IonSelectOption value="en">{t('language.en')}</IonSelectOption>
                          <IonSelectOption value="ro">{t('language.ro')}</IonSelectOption>
                          <IonSelectOption value="ru">{t('language.ru')}</IonSelectOption>
                        </IonSelect>
                      </IonItem>
                      <IonItem lines="none" className="settings-item">
                        <IonLabel>
                          <p className="settings-label">{t('settings.role')}</p>
                          <p>{t(`settings.roles.${me.role}`)}</p>
                        </IonLabel>
                      </IonItem>
                      {me.specialistProfile ? (
                        <>
                          <IonItem lines="none" className="settings-item">
                            <IonLabel>
                              <p className="settings-label">{t('settings.publicProfile')}</p>
                              <p>{me.specialistProfile.displayName}</p>
                              <p className="settings-muted">/{me.specialistProfile.slug}</p>
                            </IonLabel>
                          </IonItem>
                          <IonItem lines="none" className="settings-item settings-item--field">
                            <IonTextarea
                              label={t('settings.publicBio')}
                              labelPlacement="stacked"
                              autoGrow
                              value={publicBioDraft}
                              onIonInput={(e) => setPublicBioDraft(String(e.detail.value ?? ''))}
                              rows={4}
                            />
                          </IonItem>
                          <IonText color="medium" className="ion-padding-start ion-padding-bottom">
                            <p className="ion-no-margin">{t('settings.publicListingHint')}</p>
                          </IonText>
                          <IonItem lines="none" className="settings-item settings-item--field">
                            <IonInput
                              label={t('settings.seoTitle')}
                              labelPlacement="stacked"
                              value={seoTitleDraft}
                              onIonInput={(e) => setSeoTitleDraft(String(e.detail.value ?? ''))}
                            />
                          </IonItem>
                        </>
                      ) : null}
                      {me.role === 'CLIENT' && (categoriesQuery.data?.length ?? 0) > 0 ? (
                        <>
                          <IonItem lines="none" className="settings-item">
                            <IonLabel>
                              <h3 className="settings-h2 ion-no-margin">
                                {t('settings.interestsTitle')}
                              </h3>
                              <p className="settings-muted">{t('settings.interestsHint')}</p>
                            </IonLabel>
                          </IonItem>
                          {(categoriesQuery.data ?? []).map((c) => (
                            <IonItem key={c.id} lines="none" className="settings-item">
                              <IonCheckbox
                                slot="start"
                                checked={interestIds.includes(c.id)}
                                onIonChange={(e) => {
                                  const on = Boolean(e.detail.checked);
                                  setInterestIds((prev) =>
                                    on
                                      ? [...new Set([...prev, c.id])]
                                      : prev.filter((id) => id !== c.id),
                                  );
                                }}
                              />
                              <IonLabel>{c.name}</IonLabel>
                            </IonItem>
                          ))}
                          <IonButton
                            expand="block"
                            fill="outline"
                            shape="round"
                            className="ion-margin-top"
                            onClick={() => saveInterestsMutation.mutate()}
                            disabled={saveInterestsMutation.isPending}
                          >
                            {t('settings.interestsSave')}
                          </IonButton>
                        </>
                      ) : null}
                    </IonList>
                    <IonButton
                      expand="block"
                      shape="round"
                      className="settings-cta"
                      onClick={() => profileMutation.mutate()}
                      disabled={profileMutation.isPending}
                    >
                      {t('settings.savePhone')}
                    </IonButton>
                    {profileMutation.isError ? (
                      <IonNote color="danger">{(profileMutation.error as Error).message}</IonNote>
                    ) : null}
                  </div>

                  {me.role === 'ADMIN' ? (
                    <IonCard className="ion-margin-top">
                      <IonCardHeader>
                        <IonCardTitle>{t('settings.platformTitle')}</IonCardTitle>
                      </IonCardHeader>
                      <IonCardContent>
                        <IonText color="medium">
                          <p>{t('settings.platformBody')}</p>
                        </IonText>
                        <IonButton
                          expand="block"
                          routerLink="/tabs/admin"
                          className="ion-margin-top"
                        >
                          {t('settings.goAdmin')}
                        </IonButton>
                      </IonCardContent>
                    </IonCard>
                  ) : null}

                  {me.role === 'CLIENT' ? (
                    <IonNote className="ion-margin-top" color="medium">
                      {t('settings.clientHint')}
                    </IonNote>
                  ) : null}
                  <IonButton
                    expand="block"
                    shape="round"
                    fill="outline"
                    color="medium"
                    className="ion-margin-top settings-signout"
                    onClick={logout}
                  >
                    {t('settings.signOut')}
                  </IonButton>
                </>
              )}
            </section>
          ) : null}

          {section === 'work' && me?.role === 'SPECIALIST' ? (
            <section className="settings-section">
              <SpecialistWorkPanel />
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
}
