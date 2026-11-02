"use client";

import { FeedbackMessage } from "../components/feedback-message";
import { PresentationForm } from "../components/presentation-form";
import { PROFILE_FEEDBACK_MESSAGES } from "../constants/profile-feedback.constants";
import { useProfile } from "../hooks/use-profile";
import { useSaveProfile } from "../hooks/use-save-profile";
import { toPresentationValues } from "../utils/to-presentation-values";

export function PresentationSettings() {
  const { profile, isLoading, error: loadError, setProfile } = useProfile();
  const { savePresentation, isSaving, feedback, fieldErrors, clearFeedback } = useSaveProfile(setProfile);


  return (
    <section id="presentation" aria-label="Presentación profesional" className="scroll-mt-24 space-y-4">
      <h2 className="text-xl font-bold text-ink">Presentación profesional</h2>
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
          <PresentationForm
            initialValues={toPresentationValues(profile)}
            isSaving={isSaving}
            serverErrors={fieldErrors}
            onEdit={clearFeedback}
            onSubmit={(values) => void savePresentation(values)}
          />
        </>
      ) : null}
    </section>
  );
}
