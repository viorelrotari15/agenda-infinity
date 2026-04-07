import { AgendaApiError } from '@agenda/api-client';
import type { SpecialistGalleryImageMe } from '@agenda/shared';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonSpinner,
} from '@ionic/react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cameraOutline, imageOutline, trashOutline } from 'ionicons/icons';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../lib/api';
import { useAppToast } from '../../lib/appToast';
import { agendaKeys } from '../../lib/query-keys';

type Props = {
  publicPhotoUrl: string | null | undefined;
  galleryImages: SpecialistGalleryImageMe[] | undefined;
};

export function SpecialistMediaPanel({ publicPhotoUrl, galleryImages }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { presentSuccess, presentDanger } = useAppToast();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const invalidateMe = () => {
    void queryClient.invalidateQueries({ queryKey: agendaKeys.me() });
  };

  const onUploadError = (e: unknown) => {
    if (e instanceof AgendaApiError && e.status === 503) {
      presentDanger(t('specialistMyPage.media.storageUnavailable'));
    } else {
      presentDanger(t('specialistMyPage.media.uploadFail'));
    }
  };

  const avatarMutation = useMutation({
    mutationFn: (file: File) => api.uploadSpecialistMedia(file, 'avatar'),
    onSuccess: () => {
      invalidateMe();
      presentSuccess(t('specialistMyPage.media.uploadOk'));
    },
    onError: onUploadError,
  });

  const galleryMutation = useMutation({
    mutationFn: (file: File) => api.uploadSpecialistMedia(file, 'gallery'),
    onSuccess: () => {
      invalidateMe();
      presentSuccess(t('specialistMyPage.media.uploadOk'));
    },
    onError: onUploadError,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteSpecialistGalleryImage(id),
    onSuccess: () => {
      invalidateMe();
      presentSuccess(t('specialistMyPage.media.removed'));
    },
    onError: onUploadError,
  });

  const photo = publicPhotoUrl?.trim();
  const gallery = galleryImages ?? [];

  return (
    <>
      <IonCard className="ui-elevated ion-no-margin ion-margin-top">
        <IonCardHeader>
          <IonCardTitle>{t('specialistMyPage.media.profilePhoto')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <div className="specialist-media-avatar-row">
            <div className="specialist-media-avatar-frame">
              {photo ? (
                <img src={photo} alt="" className="specialist-media-avatar-img" />
              ) : (
                <div className="specialist-media-avatar-placeholder" aria-hidden>
                  <IonIcon icon={cameraOutline} />
                </div>
              )}
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="specialist-media-file-input"
              onChange={(ev) => {
                const f = ev.target.files?.[0];
                ev.target.value = '';
                if (f) avatarMutation.mutate(f);
              }}
            />
            <IonButton
              fill="outline"
              shape="round"
              disabled={avatarMutation.isPending}
              onClick={() => avatarInputRef.current?.click()}
            >
              {avatarMutation.isPending ? (
                <IonSpinner name="crescent" />
              ) : (
                <>
                  <IonIcon slot="start" icon={cameraOutline} />
                  {t('specialistMyPage.media.changePhoto')}
                </>
              )}
            </IonButton>
          </div>
          <p className="settings-muted ion-margin-top specialist-media-hint">
            {t('specialistMyPage.media.photoHint')}
          </p>
        </IonCardContent>
      </IonCard>

      <IonCard className="ui-elevated ion-no-margin ion-margin-top">
        <IonCardHeader>
          <IonCardTitle>{t('specialistMyPage.media.galleryTitle')}</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="specialist-media-file-input"
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              ev.target.value = '';
              if (f) galleryMutation.mutate(f);
            }}
          />
          <IonButton
            expand="block"
            shape="round"
            disabled={galleryMutation.isPending}
            onClick={() => galleryInputRef.current?.click()}
          >
            {galleryMutation.isPending ? (
              <IonSpinner name="crescent" />
            ) : (
              <>
                <IonIcon slot="start" icon={imageOutline} />
                {t('specialistMyPage.media.addGallery')}
              </>
            )}
          </IonButton>
          {gallery.length === 0 ? (
            <p className="settings-muted ion-margin-top">{t('specialistMyPage.media.noGallery')}</p>
          ) : (
            <ul className="specialist-media-gallery">
              {gallery.map((g) => (
                <li key={g.id} className="specialist-media-gallery-item">
                  <img src={g.publicUrl} alt="" className="specialist-media-gallery-img" />
                  <IonButton
                    fill="clear"
                    color="danger"
                    size="small"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate(g.id)}
                    aria-label={t('specialistMyPage.media.removeImage')}
                  >
                    <IonIcon slot="icon-only" icon={trashOutline} />
                  </IonButton>
                </li>
              ))}
            </ul>
          )}
        </IonCardContent>
      </IonCard>
    </>
  );
}
