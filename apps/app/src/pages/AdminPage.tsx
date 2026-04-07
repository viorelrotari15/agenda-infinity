import {
  IonButton,
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
  IonToggle,
} from '@ionic/react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Redirect } from 'react-router-dom';
import { AppHeader } from '../components/AppHeader';
import { PillSegmentedControl, type PillSegmentOption } from '../components/PillSegmentedControl';
import { api } from '../lib/api';
import { hasStoredAccessToken } from '../lib/auth-session';
import { useSelectModalInterface } from '../hooks/useIsMobileBreakpoint';
import { useMeQuery } from '../hooks/queries/useMeQuery';
import { agendaKeys } from '../lib/query-keys';

export default function AdminPage() {
  const { t } = useTranslation();
  const selectModal = useSelectModalInterface();
  const daysShort = t('daysShort', { returnObjects: true }) as string[];
  const adminTabs = useMemo((): PillSegmentOption<
    'users' | 'hours' | 'blocks' | 'types' | 'banners' | 'services' | 'categories' | 'reviews'
  >[] => {
    return [
      { value: 'users', label: t('admin.tabs.users') },
      { value: 'hours', label: t('admin.tabs.hours') },
      { value: 'blocks', label: t('admin.tabs.blocks') },
      { value: 'types', label: t('admin.tabs.types') },
      { value: 'banners', label: t('admin.tabs.banners') },
      { value: 'services', label: t('admin.tabs.services') },
      { value: 'categories', label: t('admin.tabs.categories') },
      { value: 'reviews', label: t('admin.tabs.reviews') },
    ];
  }, [t]);
  const queryClient = useQueryClient();
  const meQuery = useMeQuery(hasStoredAccessToken());
  const me = meQuery.data;

  const [tab, setTab] = useState<
    'users' | 'hours' | 'blocks' | 'types' | 'banners' | 'services' | 'categories' | 'reviews'
  >('users');
  const [specialistId, setSpecialistId] = useState('');

  const usersQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'users'],
    queryFn: () => api.adminListUsers(),
    enabled: me?.role === 'ADMIN',
  });

  const specialistsQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'specialists'],
    queryFn: () => api.adminListSpecialists(),
    enabled: me?.role === 'ADMIN',
  });

  const specialists = useMemo(() => specialistsQuery.data ?? [], [specialistsQuery.data]);
  const selectedSpecialist = useMemo(
    () => specialists.find((s) => s.id === specialistId) ?? null,
    [specialists, specialistId],
  );

  useEffect(() => {
    if (!specialistId && specialists.length > 0) {
      setSpecialistId(specialists[0].id);
    }
  }, [specialists, specialistId]);

  const workingHoursQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'wh', specialistId],
    queryFn: () => api.getSpecialistWorkingHours(specialistId),
    enabled: Boolean(specialistId) && me?.role === 'ADMIN',
  });

  const blocksQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'blocks', specialistId],
    queryFn: () => api.adminListAvailabilityBlocks(specialistId),
    enabled: Boolean(specialistId) && me?.role === 'ADMIN',
  });

  const typesQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'types'],
    queryFn: () => api.adminListServiceTypes(),
    enabled: me?.role === 'ADMIN',
  });

  const bannersQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'banners'],
    queryFn: () => api.adminListBanners(),
    enabled: me?.role === 'ADMIN',
  });

  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    phone: '',
    role: 'CLIENT' as 'ADMIN' | 'SPECIALIST' | 'CLIENT',
    displayName: '',
    slug: '',
  });

  const createUserMutation = useMutation({
    mutationFn: () =>
      api.adminCreateUser({
        email: newUser.email.trim(),
        password: newUser.password,
        phone: newUser.phone.trim() || undefined,
        role: newUser.role,
        displayName: newUser.displayName.trim() || undefined,
        slug: newUser.slug.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'users'] });
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'specialists'] });
    },
  });

  const [ruleDrafts, setRuleDrafts] = useState<
    Array<{ dayOfWeek: number; startLocal: string; endLocal: string }>
  >([]);

  useEffect(() => {
    if (!specialistId) return;
    const rules = workingHoursQuery.data ?? [];
    if (!rules.length) {
      setRuleDrafts(
        [1, 2, 3, 4, 5].map((d) => ({
          dayOfWeek: d,
          startLocal: '09:00',
          endLocal: '17:00',
        })),
      );
      return;
    }
    setRuleDrafts(rules.map((r) => ({ ...r })));
  }, [workingHoursQuery.data, specialistId]);

  const saveHoursMutation = useMutation({
    mutationFn: () => api.adminSetWorkingHours(specialistId, ruleDrafts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'wh', specialistId] });
      queryClient.invalidateQueries({ queryKey: agendaKeys.specialists() });
    },
  });

  const [blockForm, setBlockForm] = useState({ startUtc: '', endUtc: '', note: '' });
  const createBlockMutation = useMutation({
    mutationFn: () =>
      api.adminCreateAvailabilityBlock(specialistId, {
        startUtc: new Date(blockForm.startUtc).toISOString(),
        endUtc: new Date(blockForm.endUtc).toISOString(),
        note: blockForm.note || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...agendaKeys.all, 'admin', 'blocks', specialistId],
      });
    },
  });

  const deleteBlockMutation = useMutation({
    mutationFn: (id: string) => api.adminDeleteAvailabilityBlock(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...agendaKeys.all, 'admin', 'blocks', specialistId],
      });
    },
  });

  const [typeForm, setTypeForm] = useState({
    name: '',
    defaultDurationMinutes: 30,
    defaultBufferMinutes: 0,
  });
  const createTypeMutation = useMutation({
    mutationFn: () => api.adminCreateServiceType(typeForm),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'types'] }),
  });

  const [bannerForm, setBannerForm] = useState({
    imageUrl: '',
    title: '',
    subtitle: '',
    linkUrl: '',
  });
  const createBannerMutation = useMutation({
    mutationFn: () =>
      api.adminCreateBanner({
        imageUrl: bannerForm.imageUrl.trim(),
        title: bannerForm.title.trim(),
        subtitle: bannerForm.subtitle.trim() || undefined,
        linkUrl: bannerForm.linkUrl.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: agendaKeys.banners() });
    },
  });

  const [serviceForm, setServiceForm] = useState({
    name: '',
    durationMinutes: 30,
    bufferMinutes: 0,
    serviceTypeId: '',
  });

  const [adminPublicBioDraft, setAdminPublicBioDraft] = useState('');
  const [adminSeoTitleDraft, setAdminSeoTitleDraft] = useState('');

  useEffect(() => {
    if (!selectedSpecialist) return;
    setAdminPublicBioDraft(selectedSpecialist.publicBio ?? '');
    setAdminSeoTitleDraft(selectedSpecialist.seoTitle ?? '');
  }, [selectedSpecialist]);

  const saveAdminSeoMutation = useMutation({
    mutationFn: () =>
      api.adminPatchSpecialistPublicProfile(specialistId, {
        publicBio: adminPublicBioDraft.trim() ? adminPublicBioDraft.trim() : null,
        seoTitle: adminSeoTitleDraft.trim() ? adminSeoTitleDraft.trim() : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'specialists'] });
    },
  });

  const createServiceMutation = useMutation({
    mutationFn: () =>
      api.adminCreateService(specialistId, {
        name: serviceForm.name.trim(),
        durationMinutes: serviceForm.durationMinutes,
        bufferMinutes: serviceForm.bufferMinutes,
        serviceTypeId: serviceForm.serviceTypeId || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: agendaKeys.specialistServices(specialistId) });
    },
  });

  const adminCategoriesQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'categories'],
    queryFn: () => api.adminListCategories(),
    enabled: me?.role === 'ADMIN',
  });

  const specialistCatsQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'specialist-cats', specialistId],
    queryFn: () => api.adminGetSpecialistCategories(specialistId),
    enabled: Boolean(specialistId) && me?.role === 'ADMIN' && tab === 'categories',
  });

  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  const [primaryCatId, setPrimaryCatId] = useState<string>('');
  useEffect(() => {
    const rows = specialistCatsQuery.data ?? [];
    const ids = rows.map((r) => r.categoryId);
    setSelectedCatIds(ids);
    const primary = rows.find((r) => r.isPrimary);
    setPrimaryCatId(primary?.categoryId ?? ids[0] ?? '');
  }, [specialistCatsQuery.data]);

  const [categoryForm, setCategoryForm] = useState({
    slug: '',
    nameEn: '',
    nameRo: '',
    nameRu: '',
  });

  const createCategoryMutation = useMutation({
    mutationFn: () =>
      api.adminCreateCategory({
        slug: categoryForm.slug.trim(),
        nameEn: categoryForm.nameEn.trim(),
        nameRo: categoryForm.nameRo.trim(),
        nameRu: categoryForm.nameRu.trim(),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: agendaKeys.publicCategories() });
      setCategoryForm({ slug: '', nameEn: '', nameRo: '', nameRu: '' });
    },
  });

  const saveSpecialistCatsMutation = useMutation({
    mutationFn: () =>
      api.adminSetSpecialistCategories(specialistId, {
        categoryIds: selectedCatIds,
        primaryCategoryId: primaryCatId || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...agendaKeys.all, 'admin', 'specialist-cats', specialistId],
      });
      queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    },
  });

  const [reviewStatusFilter, setReviewStatusFilter] = useState<
    'PENDING' | 'APPROVED' | 'REJECTED' | ''
  >('PENDING');

  const adminReviewsQuery = useQuery({
    queryKey: [...agendaKeys.all, 'admin', 'reviews', reviewStatusFilter],
    queryFn: () =>
      api.adminListReviews(reviewStatusFilter ? { status: reviewStatusFilter } : undefined),
    enabled: me?.role === 'ADMIN' && tab === 'reviews',
  });

  const moderateReviewMutation = useMutation({
    mutationFn: (p: { id: string; status: 'APPROVED' | 'REJECTED' }) =>
      api.adminModerateReview(p.id, { status: p.status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...agendaKeys.all, 'admin', 'reviews'] });
      queryClient.invalidateQueries({ queryKey: agendaKeys.all });
    },
  });

  if (meQuery.isLoading) {
    return (
      <IonPage>
        <AppHeader title={t('admin.title')} />
        <IonContent className="app-content ion-padding">
          <IonText color="medium">{t('admin.loading')}</IonText>
        </IonContent>
      </IonPage>
    );
  }

  if (!me || me.role !== 'ADMIN') {
    return <Redirect to="/tabs/discover" />;
  }

  return (
    <IonPage>
      <AppHeader title={t('admin.title')} />
      <IonContent fullscreen className="app-content ion-padding admin-page">
        <div className="admin-shell ui-elevated">
          <IonText>
            <h1 className="admin-title">{t('admin.heroTitle')}</h1>
            <p className="admin-sub">{t('admin.heroSub')}</p>
          </IonText>

          <PillSegmentedControl scrollable value={tab} onChange={setTab} options={adminTabs} />

          {tab === 'users' ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.directory')}</h2>
              <IonList lines="full" className="admin-list">
                {(usersQuery.data ?? []).map((u) => (
                  <IonItem key={u.id}>
                    <IonLabel>
                      <h3>{u.email}</h3>
                      <p>
                        {u.role}
                        {u.phone ? ` · ${u.phone}` : ''}
                        {u.specialist ? ` · ${u.specialist.displayName}` : ''}
                      </p>
                    </IonLabel>
                  </IonItem>
                ))}
              </IonList>

              <h2 className="admin-h2">{t('admin.createUser')}</h2>
              <IonList lines="none" className="admin-form">
                <IonItem>
                  <IonInput
                    label={t('auth.email')}
                    labelPlacement="stacked"
                    value={newUser.email}
                    onIonInput={(e) => setNewUser({ ...newUser, email: e.detail.value ?? '' })}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label={t('auth.password')}
                    labelPlacement="stacked"
                    type="password"
                    value={newUser.password}
                    onIonInput={(e) => setNewUser({ ...newUser, password: e.detail.value ?? '' })}
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label={t('auth.phone')}
                    labelPlacement="stacked"
                    value={newUser.phone}
                    onIonInput={(e) => setNewUser({ ...newUser, phone: e.detail.value ?? '' })}
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">{t('admin.role')}</IonLabel>
                  <IonSelect
                    key={selectModal ? 'if-modal' : 'if-alert'}
                    interface={selectModal ? 'modal' : 'alert'}
                    interfaceOptions={
                      selectModal
                        ? { header: t('admin.role'), cssClass: 'app-select-modal' }
                        : undefined
                    }
                    value={newUser.role}
                    onIonChange={(e) =>
                      setNewUser({ ...newUser, role: e.detail.value as typeof newUser.role })
                    }
                  >
                    <IonSelectOption value="CLIENT">{t('admin.roles.CLIENT')}</IonSelectOption>
                    <IonSelectOption value="SPECIALIST">
                      {t('admin.roles.SPECIALIST')}
                    </IonSelectOption>
                    <IonSelectOption value="ADMIN">{t('admin.roles.ADMIN')}</IonSelectOption>
                  </IonSelect>
                </IonItem>
                {newUser.role === 'SPECIALIST' ? (
                  <>
                    <IonItem>
                      <IonInput
                        label={t('admin.displayName')}
                        labelPlacement="stacked"
                        value={newUser.displayName}
                        onIonInput={(e) =>
                          setNewUser({ ...newUser, displayName: e.detail.value ?? '' })
                        }
                      />
                    </IonItem>
                    <IonItem>
                      <IonInput
                        label={t('admin.slug')}
                        labelPlacement="stacked"
                        value={newUser.slug}
                        onIonInput={(e) => setNewUser({ ...newUser, slug: e.detail.value ?? '' })}
                      />
                    </IonItem>
                  </>
                ) : null}
              </IonList>
              {createUserMutation.isError ? (
                <IonNote color="danger">{(createUserMutation.error as Error).message}</IonNote>
              ) : null}
              <IonButton
                expand="block"
                onClick={() => createUserMutation.mutate()}
                disabled={createUserMutation.isPending}
              >
                {t('admin.createUserCta')}
              </IonButton>
            </section>
          ) : null}

          {tab === 'hours' || tab === 'blocks' || tab === 'services' ? (
            <div className="admin-specialist-pick">
              <IonItem lines="none">
                <IonLabel position="stacked">{t('admin.specialistPick')}</IonLabel>
                <IonSelect
                  key={selectModal ? 'if-modal' : 'if-popover'}
                  interface={selectModal ? 'modal' : 'popover'}
                  interfaceOptions={
                    selectModal
                      ? { header: t('admin.specialistPick'), cssClass: 'app-select-modal' }
                      : undefined
                  }
                  placeholder={t('admin.chooseSpecialist')}
                  value={specialistId}
                  onIonChange={(e) => setSpecialistId(String(e.detail.value))}
                >
                  {specialists.map((s) => (
                    <IonSelectOption key={s.id} value={s.id}>
                      {t('admin.specialistOption', { name: s.displayName, slug: s.slug })}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
            </div>
          ) : null}

          {tab === 'hours' && specialistId ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.hoursLocal')}</h2>
              <IonText color="medium">
                <p className="admin-hint">
                  {t('admin.hoursHint', { name: selectedSpecialist?.displayName ?? '—' })}
                </p>
              </IonText>
              {ruleDrafts.map((row, idx) => (
                <IonItem key={`${row.dayOfWeek}-${idx}`}>
                  <IonLabel>{daysShort[row.dayOfWeek]}</IonLabel>
                  <IonInput
                    style={{ maxWidth: 96 }}
                    value={row.startLocal}
                    onIonInput={(e) => {
                      const v = e.detail.value ?? '';
                      const next = [...ruleDrafts];
                      next[idx] = { ...next[idx], startLocal: v };
                      setRuleDrafts(next);
                    }}
                  />
                  <IonInput
                    style={{ maxWidth: 96 }}
                    value={row.endLocal}
                    onIonInput={(e) => {
                      const v = e.detail.value ?? '';
                      const next = [...ruleDrafts];
                      next[idx] = { ...next[idx], endLocal: v };
                      setRuleDrafts(next);
                    }}
                  />
                </IonItem>
              ))}
              <IonButton
                expand="block"
                onClick={() => saveHoursMutation.mutate()}
                disabled={saveHoursMutation.isPending}
              >
                {t('admin.saveWorkingHours')}
              </IonButton>
            </section>
          ) : null}

          {tab === 'blocks' && specialistId ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.blocksTitle')}</h2>
              <IonList>
                <IonItem>
                  <IonInput
                    label={t('admin.startLocal')}
                    labelPlacement="stacked"
                    type="datetime-local"
                    value={blockForm.startUtc}
                    onIonInput={(e) =>
                      setBlockForm({ ...blockForm, startUtc: String(e.detail.value ?? '') })
                    }
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label={t('admin.endLocal')}
                    labelPlacement="stacked"
                    type="datetime-local"
                    value={blockForm.endUtc}
                    onIonInput={(e) =>
                      setBlockForm({ ...blockForm, endUtc: String(e.detail.value ?? '') })
                    }
                  />
                </IonItem>
                <IonItem>
                  <IonInput
                    label={t('admin.note')}
                    labelPlacement="stacked"
                    value={blockForm.note}
                    onIonInput={(e) =>
                      setBlockForm({ ...blockForm, note: String(e.detail.value ?? '') })
                    }
                  />
                </IonItem>
              </IonList>
              <IonButton
                expand="block"
                onClick={() => createBlockMutation.mutate()}
                disabled={createBlockMutation.isPending || !blockForm.startUtc || !blockForm.endUtc}
              >
                {t('admin.addBlock')}
              </IonButton>
              <IonList>
                {(blocksQuery.data ?? []).map((b) => (
                  <IonItem key={b.id}>
                    <IonLabel>
                      <p>{new Date(b.startUtc).toLocaleString()}</p>
                      <p>{new Date(b.endUtc).toLocaleString()}</p>
                      {b.note ? <p>{b.note}</p> : null}
                    </IonLabel>
                    <IonButton
                      fill="clear"
                      color="danger"
                      onClick={() => deleteBlockMutation.mutate(b.id)}
                    >
                      {t('admin.remove')}
                    </IonButton>
                  </IonItem>
                ))}
              </IonList>
            </section>
          ) : null}

          {tab === 'types' ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.typesCatalog')}</h2>
              <IonList>
                {(typesQuery.data ?? []).map((st) => (
                  <IonItem key={st.id}>
                    <IonLabel>
                      <h3>{st.name}</h3>
                      <p>
                        {t('admin.typeMeta', {
                          duration: st.defaultDurationMinutes,
                          buffer: st.defaultBufferMinutes,
                          state: st.active ? t('admin.active') : t('admin.inactive'),
                        })}
                      </p>
                    </IonLabel>
                    <IonToggle
                      checked={st.active}
                      onIonChange={(e) =>
                        api.adminUpdateServiceType(st.id, { active: e.detail.checked }).then(() =>
                          queryClient.invalidateQueries({
                            queryKey: [...agendaKeys.all, 'admin', 'types'],
                          }),
                        )
                      }
                    />
                  </IonItem>
                ))}
              </IonList>
              <IonItem>
                <IonInput
                  label={t('admin.name')}
                  labelPlacement="stacked"
                  value={typeForm.name}
                  onIonInput={(e) => setTypeForm({ ...typeForm, name: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('settings.durationMin')}
                  labelPlacement="stacked"
                  type="number"
                  value={String(typeForm.defaultDurationMinutes)}
                  onIonInput={(e) =>
                    setTypeForm({
                      ...typeForm,
                      defaultDurationMinutes: Number(e.detail.value ?? 0),
                    })
                  }
                />
              </IonItem>
              <IonButton expand="block" onClick={() => createTypeMutation.mutate()}>
                {t('admin.addServiceType')}
              </IonButton>
            </section>
          ) : null}

          {tab === 'banners' ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.bannersTitle')}</h2>
              <IonList>
                {(bannersQuery.data ?? []).map((b) => (
                  <IonItem key={b.id}>
                    <IonLabel>
                      <h3>{b.title}</h3>
                      <p>{b.subtitle}</p>
                    </IonLabel>
                    <IonToggle
                      checked={b.active}
                      onIonChange={(e) =>
                        api.adminUpdateBanner(b.id, { active: e.detail.checked }).then(() => {
                          queryClient.invalidateQueries({
                            queryKey: [...agendaKeys.all, 'admin', 'banners'],
                          });
                          queryClient.invalidateQueries({ queryKey: agendaKeys.banners() });
                        })
                      }
                    />
                  </IonItem>
                ))}
              </IonList>
              <IonItem>
                <IonInput
                  label={t('admin.imageUrl')}
                  labelPlacement="stacked"
                  value={bannerForm.imageUrl}
                  onIonInput={(e) =>
                    setBannerForm({ ...bannerForm, imageUrl: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('admin.bannerTitle')}
                  labelPlacement="stacked"
                  value={bannerForm.title}
                  onIonInput={(e) => setBannerForm({ ...bannerForm, title: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('admin.subtitle')}
                  labelPlacement="stacked"
                  value={bannerForm.subtitle}
                  onIonInput={(e) =>
                    setBannerForm({ ...bannerForm, subtitle: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonButton expand="block" onClick={() => createBannerMutation.mutate()}>
                {t('admin.addBanner')}
              </IonButton>
            </section>
          ) : null}

          {tab === 'services' && specialistId ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.publicListingSeo')}</h2>
              <IonText color="medium">
                <p className="admin-hint">{t('settings.publicListingHint')}</p>
              </IonText>
              <IonItem lines="none">
                <IonTextarea
                  label={t('settings.publicBio')}
                  labelPlacement="stacked"
                  autoGrow
                  value={adminPublicBioDraft}
                  onIonInput={(e) => setAdminPublicBioDraft(String(e.detail.value ?? ''))}
                  rows={4}
                />
              </IonItem>
              <IonItem lines="none">
                <IonInput
                  label={t('settings.seoTitle')}
                  labelPlacement="stacked"
                  value={adminSeoTitleDraft}
                  onIonInput={(e) => setAdminSeoTitleDraft(String(e.detail.value ?? ''))}
                />
              </IonItem>
              <IonButton
                expand="block"
                onClick={() => saveAdminSeoMutation.mutate()}
                disabled={saveAdminSeoMutation.isPending}
              >
                {t('admin.savePublicListing')}
              </IonButton>
              {saveAdminSeoMutation.isError ? (
                <IonNote color="danger">{(saveAdminSeoMutation.error as Error).message}</IonNote>
              ) : null}

              <h2 className="admin-h2 ion-margin-top">
                {t('admin.servicesFor', { name: selectedSpecialist?.displayName ?? '—' })}
              </h2>
              <IonItem>
                <IonInput
                  label={t('admin.name')}
                  labelPlacement="stacked"
                  value={serviceForm.name}
                  onIonInput={(e) => setServiceForm({ ...serviceForm, name: e.detail.value ?? '' })}
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('settings.durationMin')}
                  labelPlacement="stacked"
                  type="number"
                  value={String(serviceForm.durationMinutes)}
                  onIonInput={(e) =>
                    setServiceForm({ ...serviceForm, durationMinutes: Number(e.detail.value ?? 0) })
                  }
                />
              </IonItem>
              <IonItem>
                <IonLabel position="stacked">{t('admin.serviceTypeOptional')}</IonLabel>
                <IonSelect
                  key={selectModal ? 'if-modal' : 'if-alert'}
                  interface={selectModal ? 'modal' : 'alert'}
                  interfaceOptions={
                    selectModal
                      ? { header: t('admin.serviceTypeOptional'), cssClass: 'app-select-modal' }
                      : undefined
                  }
                  value={serviceForm.serviceTypeId}
                  onIonChange={(e) =>
                    setServiceForm({
                      ...serviceForm,
                      serviceTypeId: String(e.detail.value ?? ''),
                    })
                  }
                >
                  <IonSelectOption value="">{t('admin.custom')}</IonSelectOption>
                  {(typesQuery.data ?? []).map((t) => (
                    <IonSelectOption key={t.id} value={t.id}>
                      {t.name}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              <IonButton expand="block" onClick={() => createServiceMutation.mutate()}>
                {t('admin.createService')}
              </IonButton>
            </section>
          ) : null}

          {tab === 'categories' ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.categoriesTitle')}</h2>
              <IonList lines="full">
                {(adminCategoriesQuery.data ?? []).map((c) => (
                  <IonItem key={c.id}>
                    <IonLabel>
                      <h3>{c.slug}</h3>
                      <p>
                        {c.nameEn} · {c.nameRo} · {c.nameRu}
                      </p>
                      <p className="ion-text-wrap ion-margin-top">
                        {t('admin.categorySpecialistCount', { count: c._count.specialists })}
                      </p>
                    </IonLabel>
                    <IonToggle
                      checked={c.active}
                      onIonChange={(e) =>
                        api.adminUpdateCategory(c.id, { active: e.detail.checked }).then(() => {
                          queryClient.invalidateQueries({
                            queryKey: [...agendaKeys.all, 'admin', 'categories'],
                          });
                          queryClient.invalidateQueries({
                            queryKey: agendaKeys.publicCategories(),
                          });
                        })
                      }
                    />
                  </IonItem>
                ))}
              </IonList>
              <IonItem>
                <IonInput
                  label={t('admin.categorySlug')}
                  labelPlacement="stacked"
                  value={categoryForm.slug}
                  onIonInput={(e) =>
                    setCategoryForm({ ...categoryForm, slug: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('admin.categoryNameEn')}
                  labelPlacement="stacked"
                  value={categoryForm.nameEn}
                  onIonInput={(e) =>
                    setCategoryForm({ ...categoryForm, nameEn: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('admin.categoryNameRo')}
                  labelPlacement="stacked"
                  value={categoryForm.nameRo}
                  onIonInput={(e) =>
                    setCategoryForm({ ...categoryForm, nameRo: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonItem>
                <IonInput
                  label={t('admin.categoryNameRu')}
                  labelPlacement="stacked"
                  value={categoryForm.nameRu}
                  onIonInput={(e) =>
                    setCategoryForm({ ...categoryForm, nameRu: e.detail.value ?? '' })
                  }
                />
              </IonItem>
              <IonButton expand="block" onClick={() => createCategoryMutation.mutate()}>
                {t('admin.addCategory')}
              </IonButton>

              <h2 className="admin-h2 ion-margin-top">{t('admin.specialistCategoriesTitle')}</h2>
              <IonText color="medium">
                <p>{t('admin.assignCategoriesHint')}</p>
              </IonText>
              <IonItem>
                <IonLabel position="stacked">{t('admin.specialistPick')}</IonLabel>
                <IonSelect
                  key={selectModal ? 'if-modal' : 'if-alert'}
                  interface={selectModal ? 'modal' : 'alert'}
                  value={specialistId}
                  onIonChange={(e) => setSpecialistId(String(e.detail.value ?? ''))}
                >
                  {(specialistsQuery.data ?? []).map((s) => (
                    <IonSelectOption key={s.id} value={s.id}>
                      {t('admin.specialistOption', { name: s.displayName, slug: s.slug })}
                    </IonSelectOption>
                  ))}
                </IonSelect>
              </IonItem>
              {specialistId ? (
                <>
                  {(adminCategoriesQuery.data ?? [])
                    .filter((c) => c.active)
                    .map((c) => (
                      <IonItem key={c.id}>
                        <IonCheckbox
                          slot="start"
                          checked={selectedCatIds.includes(c.id)}
                          onIonChange={(e) => {
                            const on = Boolean(e.detail.checked);
                            setSelectedCatIds((prev) =>
                              on ? [...new Set([...prev, c.id])] : prev.filter((id) => id !== c.id),
                            );
                          }}
                        />
                        <IonLabel>{c.nameEn}</IonLabel>
                      </IonItem>
                    ))}
                  <IonItem>
                    <IonLabel position="stacked">Primary category</IonLabel>
                    <IonSelect
                      value={primaryCatId}
                      onIonChange={(e) => setPrimaryCatId(String(e.detail.value ?? ''))}
                    >
                      {selectedCatIds.map((id) => {
                        const c = (adminCategoriesQuery.data ?? []).find((x) => x.id === id);
                        return c ? (
                          <IonSelectOption key={id} value={id}>
                            {c.nameEn}
                          </IonSelectOption>
                        ) : null;
                      })}
                    </IonSelect>
                  </IonItem>
                  <IonButton
                    expand="block"
                    onClick={() => saveSpecialistCatsMutation.mutate()}
                    disabled={saveSpecialistCatsMutation.isPending}
                  >
                    {t('admin.saveSpecialistCategories')}
                  </IonButton>
                </>
              ) : null}
            </section>
          ) : null}

          {tab === 'reviews' ? (
            <section className="admin-section">
              <h2 className="admin-h2">{t('admin.reviewsTitle')}</h2>
              <IonItem lines="none">
                <IonLabel position="stacked">{t('admin.reviewStatus')}</IonLabel>
                <IonSelect
                  value={reviewStatusFilter}
                  onIonChange={(e) =>
                    setReviewStatusFilter(
                      (e.detail.value as 'PENDING' | 'APPROVED' | 'REJECTED' | '') ?? '',
                    )
                  }
                >
                  <IonSelectOption value="PENDING">PENDING</IonSelectOption>
                  <IonSelectOption value="APPROVED">APPROVED</IonSelectOption>
                  <IonSelectOption value="REJECTED">REJECTED</IonSelectOption>
                  <IonSelectOption value="">ALL</IonSelectOption>
                </IonSelect>
              </IonItem>
              <IonList lines="full">
                {(adminReviewsQuery.data ?? []).map((r) => (
                  <IonItem key={r.id}>
                    <IonLabel className="ion-text-wrap">
                      <h3>{r.specialist.displayName}</h3>
                      <p>
                        {r.author.email} · {r.rating}★ · {r.status}
                      </p>
                      <p>{r.comment}</p>
                    </IonLabel>
                    {r.status === 'PENDING' ? (
                      <>
                        <IonButton
                          size="small"
                          onClick={() =>
                            moderateReviewMutation.mutate({ id: r.id, status: 'APPROVED' })
                          }
                        >
                          {t('admin.approveReview')}
                        </IonButton>
                        <IonButton
                          size="small"
                          color="medium"
                          fill="outline"
                          onClick={() =>
                            moderateReviewMutation.mutate({ id: r.id, status: 'REJECTED' })
                          }
                        >
                          {t('admin.rejectReview')}
                        </IonButton>
                      </>
                    ) : null}
                  </IonItem>
                ))}
              </IonList>
            </section>
          ) : null}
        </div>
      </IonContent>
    </IonPage>
  );
}
