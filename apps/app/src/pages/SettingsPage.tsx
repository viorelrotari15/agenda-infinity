import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
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
  IonToggle,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppHeader } from '../components/AppHeader';
import { PillSegmentedControl } from '../components/PillSegmentedControl';
import { api } from '../lib/api';
import { clearSession, hasStoredAccessToken } from '../lib/auth-session';
import { useSelectModalInterface } from '../hooks/useIsMobileBreakpoint';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { agendaKeys } from '../lib/query-keys';
import type { WorkingHoursRule } from '@agenda/shared';
import i18n from '../i18n/i18n';

export default function SettingsPage() {
  const { t } = useTranslation();
  const selectModal = useSelectModalInterface();
  const daysShort = t('daysShort', { returnObjects: true }) as string[];
  const queryClient = useQueryClient();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  const logout = () => {
    clearSession();
    queryClient.removeQueries({ queryKey: agendaKeys.me() });
    window.location.assign('/tabs/book');
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

  const whQuery = useQuery({
    queryKey: [...agendaKeys.all, 'my-wh'],
    queryFn: () => api.getWorkingHours(),
    enabled: me?.role === 'SPECIALIST',
  });

  const [rules, setRules] = useState<WorkingHoursRule[]>([]);
  useEffect(() => {
    const data = whQuery.data;
    if (!data?.length && me?.role === 'SPECIALIST') {
      setRules(
        [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startLocal: '09:00', endLocal: '17:00' })),
      );
      return;
    }
    if (data?.length) setRules(data.map((r) => ({ ...r })));
  }, [whQuery.data, me?.role]);

  const saveWhMutation = useMutation({
    mutationFn: () => api.setWorkingHours(rules),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'my-wh'] });
      queryClient.invalidateQueries({ queryKey: agendaKeys.specialists() });
      const sid = me?.specialistProfile?.id;
      if (sid) {
        queryClient.invalidateQueries({ queryKey: agendaKeys.specialistWorkingHours(sid) });
      }
    },
  });

  const servicesQuery = useQuery({
    queryKey: agendaKeys.myServices(),
    queryFn: () => api.listMyServices(),
    enabled: me?.role === 'SPECIALIST',
  });

  const [newSvc, setNewSvc] = useState({ name: '', durationMinutes: 30, bufferMinutes: 0 });
  const createSvcMutation = useMutation({
    mutationFn: () =>
      api.createService({
        name: newSvc.name.trim(),
        durationMinutes: newSvc.durationMinutes,
        bufferMinutes: newSvc.bufferMinutes,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.myServices() });
      if (me?.specialistProfile?.id) {
        queryClient.invalidateQueries({
          queryKey: agendaKeys.specialistServices(me.specialistProfile.id),
        });
      }
      setNewSvc({ name: '', durationMinutes: 30, bufferMinutes: 0 });
    },
  });

  const toggleSvcMutation = useMutation({
    mutationFn: (p: { id: string; active: boolean }) =>
      api.patchSpecialistService(p.id, { active: p.active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.myServices() });
      if (me?.specialistProfile?.id) {
        queryClient.invalidateQueries({
          queryKey: agendaKeys.specialistServices(me.specialistProfile.id),
        });
      }
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
              <div className="settings-block settings-block--glass">
                <h2 className="settings-h2">{t('settings.workingHours')}</h2>
                <p className="settings-hint">{t('settings.workingHoursHint')}</p>
                <div className="settings-wh-stack">
                  {rules.map((row, idx) => (
                    <IonItem
                      key={`${row.dayOfWeek}-${idx}`}
                      lines="none"
                      className="settings-item settings-wh-row"
                    >
                      <IonLabel className="settings-wh-day">{daysShort[row.dayOfWeek]}</IonLabel>
                      <div className="settings-wh-times" slot="end">
                        <IonInput
                          className="settings-time-input"
                          aria-label={`${daysShort[row.dayOfWeek]} start`}
                          value={row.startLocal}
                          onIonInput={(e) => {
                            const v = String(e.detail.value ?? '');
                            const next = [...rules];
                            next[idx] = { ...next[idx], startLocal: v };
                            setRules(next);
                          }}
                        />
                        <span className="settings-wh-sep" aria-hidden>
                          –
                        </span>
                        <IonInput
                          className="settings-time-input"
                          aria-label={`${daysShort[row.dayOfWeek]} end`}
                          value={row.endLocal}
                          onIonInput={(e) => {
                            const v = String(e.detail.value ?? '');
                            const next = [...rules];
                            next[idx] = { ...next[idx], endLocal: v };
                            setRules(next);
                          }}
                        />
                      </div>
                    </IonItem>
                  ))}
                </div>
                <IonButton
                  expand="block"
                  shape="round"
                  className="settings-cta"
                  onClick={() => saveWhMutation.mutate()}
                  disabled={saveWhMutation.isPending}
                >
                  {t('settings.saveWorkingHours')}
                </IonButton>
              </div>

              <div className="settings-block settings-block--glass">
                <h2 className="settings-h2">Services</h2>
                <p className="settings-hint settings-hint--tight">
                  Offerings clients can book with you.
                </p>
                <IonList lines="none" className="settings-services-list">
                  {(servicesQuery.data ?? []).map((s) => (
                    <IonItem key={s.id} lines="none" className="settings-item settings-service-row">
                      <IonLabel>
                        <h3 className="settings-service-name">{s.name}</h3>
                        <p className="settings-service-meta">
                          {t('settings.serviceMeta', {
                            duration: s.durationMinutes,
                            buffer: s.bufferMinutes,
                          })}
                        </p>
                      </IonLabel>
                      <IonToggle
                        slot="end"
                        className="settings-service-toggle"
                        checked={s.active}
                        onIonChange={(e) =>
                          toggleSvcMutation.mutate({ id: s.id, active: e.detail.checked })
                        }
                      />
                    </IonItem>
                  ))}
                </IonList>
                <div className="settings-add-service">
                  <IonItem lines="none" className="settings-item settings-item--field">
                    <IonInput
                      label={t('settings.newServiceName')}
                      labelPlacement="stacked"
                      value={newSvc.name}
                      onIonInput={(e) =>
                        setNewSvc({ ...newSvc, name: String(e.detail.value ?? '') })
                      }
                    />
                  </IonItem>
                  <IonItem lines="none" className="settings-item settings-item--field">
                    <IonInput
                      label={t('settings.durationMin')}
                      labelPlacement="stacked"
                      type="number"
                      value={String(newSvc.durationMinutes)}
                      onIonInput={(e) =>
                        setNewSvc({ ...newSvc, durationMinutes: Number(e.detail.value ?? 0) })
                      }
                    />
                  </IonItem>
                  <IonButton
                    expand="block"
                    shape="round"
                    className="settings-cta settings-cta--secondary"
                    fill="outline"
                    onClick={() => createSvcMutation.mutate()}
                    disabled={createSvcMutation.isPending || !newSvc.name.trim()}
                  >
                    {t('settings.addService')}
                  </IonButton>
                </div>
              </div>
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
}
