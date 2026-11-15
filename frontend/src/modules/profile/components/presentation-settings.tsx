'use client';

import { useEffect } from 'react';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { FeedbackMessage } from './feedback-message';
import { PresentationForm } from './presentation-form';
import { PROFILE_FEEDBACK_MESSAGES } from '../constants/profile-feedback.constants';
import { useProfile } from '../hooks/use-profile';
import { useSaveProfile } from '../hooks/use-save-profile';
import { toPresentationValues } from '../utils/to-presentation-values';

export function PresentationSettings({
  guide,
}: { guide?: ProfileGuideStepProps } = {}) {
  const {
    profile,
    isLoading,
    error: loadError,
    setProfile,
  } = useProfile({ forGuide: Boolean(guide) });
  const { savePresentation, isSaving, feedback, fieldErrors, clearFeedback } =
    useSaveProfile(setProfile);
  const onBusyChange = guide?.onBusyChange;
  useEffect(() => {
    onBusyChange?.(isSaving);
  }, [isSaving, onBusyChange]);

  return (
    <section
      id={guide ? 'profile-guide-presentation' : 'presentation'}
      aria-label="Presentación profesional"
      className="scroll-mt-24 space-y-4"
    >
      <h2 className="text-xl font-bold text-ink">Presentación profesional</h2>
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
          <PresentationForm
            idPrefix={guide ? 'profile-guide-' : undefined}
            saveLabel={guide ? 'Guardar cambios' : undefined}
            initialValues={toPresentationValues(profile)}
            isSaving={isSaving}
            serverErrors={fieldErrors}
            onEdit={(field) => {
              clearFeedback(field);
              guide?.onDirtyChange(Boolean(field));
            }}
            onSubmit={async (values) => {
              guide?.onBusyChange(true);
              try {
                if (await savePresentation(values)) {
                  guide?.onDirtyChange(false);
                  guide?.onSaved();
                }
              } finally {
                guide?.onBusyChange(false);
              }
            }}
          />
        </>
      ) : null}
    </section>
  );
}
