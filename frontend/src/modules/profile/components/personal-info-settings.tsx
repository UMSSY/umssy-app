'use client';

import { useEffect, useState } from 'react';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { FeedbackMessage } from './feedback-message';
import { PersonalInfoForm } from './personal-info-form';
import { ProfilePhotoFeedback } from './profile-photo-feedback';
import { PROFILE_FEEDBACK_MESSAGES } from '../constants/profile-feedback.constants';
import { useCities } from '../hooks/use-cities';
import { useProfile } from '../hooks/use-profile';
import { useProfilePhoto } from '../hooks/use-profile-photo';
import { useSaveProfile } from '../hooks/use-save-profile';
import type { PersonalInfoValues } from '../types/personal-info-values.types';
import { toPersonalInfoValues } from '../utils/to-personal-info-values';

export function PersonalInfoSettings({
  guide,
}: { guide?: ProfileGuideStepProps } = {}) {
  const {
    profile,
    isLoading,
    error: loadError,
    setProfile,
  } = useProfile({ forGuide: Boolean(guide) });
  const { cities, error: citiesError } = useCities();
  const { savePersonalInfo, isSaving, feedback, fieldErrors, clearFeedback } =
    useSaveProfile(setProfile);
  const photo = useProfilePhoto();
  const [fieldsDirty, setFieldsDirty] = useState(false);
  const isBusy = isSaving || photo.isUploading || photo.isDeleting;

  const onBusyChange = guide?.onBusyChange;
  const onDirtyChange = guide?.onDirtyChange;
  useEffect(() => {
    onBusyChange?.(isBusy);
  }, [isBusy, onBusyChange]);
  useEffect(() => {
    onDirtyChange?.(fieldsDirty || Boolean(photo.previewUrl));
  }, [fieldsDirty, photo.previewUrl, onDirtyChange]);

  const handleSubmit = async (values: PersonalInfoValues) => {
    if (isBusy) return;
    if (await savePersonalInfo(values)) {
      setFieldsDirty(false);
      guide?.onSaved();
      guide?.onDirtyChange(Boolean(photo.previewUrl));
    }
  };

  return (
    <section
      id={guide ? 'profile-guide-personal-info' : 'personal-info'}
      aria-label="Datos personales y contacto"
      className="scroll-mt-24 space-y-4"
    >
      <h2 className="text-xl font-bold text-ink">
        Datos personales y contacto
      </h2>
      {isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          {PROFILE_FEEDBACK_MESSAGES.loading}
        </p>
      ) : null}

      {!isLoading && !profile ? (
        <FeedbackMessage
          feedback={{
            type: 'error',
            message: loadError ?? PROFILE_FEEDBACK_MESSAGES.loadError,
          }}
        />
      ) : null}

      {profile ? (
        <>
          <FeedbackMessage feedback={feedback} />
          <FeedbackMessage
            feedback={
              citiesError ? { type: 'error', message: citiesError } : null
            }
          />
          <PersonalInfoForm
            idPrefix={guide ? 'profile-guide-' : undefined}
            saveLabel={guide ? 'Guardar cambios' : undefined}
            initialValues={toPersonalInfoValues(profile)}
            cities={cities}
            isSaving={isBusy}
            serverErrors={fieldErrors}
            onEdit={(field) => {
              clearFeedback(field);
              setFieldsDirty(Boolean(field));
              guide?.onDirtyChange(Boolean(field) || Boolean(photo.previewUrl));
            }}
            photo={{
              photoUrl: photo.photoUrl,
              previewUrl: photo.previewUrl,
              isUploading: photo.isUploading || isSaving,
              isDeleting: photo.isDeleting,
              error: photo.error,
              onSelectPhoto: photo.selectPhoto,
              onConfirmPhoto: () => void photo.confirmPhoto(),
              onCancelPhoto: photo.cancelPhoto,
              onDeletePhoto: () => void photo.deletePhoto(),
            }}
            onSubmit={handleSubmit}
          />
          <ProfilePhotoFeedback
            error={photo.loadError}
            isLoading={photo.isLoading}
            isUploading={photo.isUploading || photo.isDeleting}
            onRetry={() => void photo.reloadPhoto()}
          />
        </>
      ) : null}
    </section>
  );
}
