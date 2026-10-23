"use client";

import { FeedbackMessage } from "../components/feedback-message";
import { PersonalInfoForm } from "../components/personal-info-form";
import { ProfilePhotoFeedback } from "../components/profile-photo-feedback";
import { PROFILE_FEEDBACK_MESSAGES } from "../constants/profile-feedback.constants";
import { useCities } from "../hooks/use-cities";
import { useProfile } from "../hooks/use-profile";
import { useProfilePhoto } from "../hooks/use-profile-photo";
import { useSaveProfile } from "../hooks/use-save-profile";
import type { PersonalInfoValues } from "../types/personal-info-values.types";
import { toPersonalInfoValues } from "../utils/to-personal-info-values";

export function PersonalInfoSettings() {
  const { profile, isLoading, error: loadError, setProfile } = useProfile();
  const { cities, error: citiesError } = useCities();
  const { savePersonalInfo, isSaving, feedback, fieldErrors, clearFeedback } = useSaveProfile(setProfile);
  const photo = useProfilePhoto();

  const handleSubmit = (values: PersonalInfoValues) => {
    void savePersonalInfo(values);
  };

  return (
    <section id="personal-info" aria-label="Datos personales y contacto" className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-bold text-ink">Datos personales y contacto</h2>
      {isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          {PROFILE_FEEDBACK_MESSAGES.loading}
        </p>
      ) : null}

      {!isLoading && !profile ? (
        <FeedbackMessage
          feedback={{ type: "error", message: loadError ?? PROFILE_FEEDBACK_MESSAGES.loadError }}
        />
      ) : null}

      {profile ? (
        <>
          <FeedbackMessage feedback={feedback} />
          <FeedbackMessage
            feedback={citiesError ? { type: "error", message: citiesError } : null}
          />
          <PersonalInfoForm
            initialValues={toPersonalInfoValues(profile)}
            cities={cities}
            isSaving={isSaving}
            serverErrors={fieldErrors}
            onEdit={clearFeedback}
            photo={{
              photoUrl: photo.photoUrl,
              previewUrl: photo.previewUrl,
              isUploading: photo.isUploading,
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
