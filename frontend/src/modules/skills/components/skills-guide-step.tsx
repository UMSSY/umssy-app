'use client';

import { useEffect, useState } from 'react';
import { FeedbackMessage } from '@/modules/profile';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { useSkills } from '../hooks/use-skills';
import { DetectedSkillsPanel } from './detected-skills-panel';
import { SkillsSelector } from './skills-selector';

export function SkillsGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const skills = useSkills({ forGuide: true });
  const [hasCustomDraft, setHasCustomDraft] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [draftError, setDraftError] = useState<string | null>(null);
  const isBusy = skills.isLoading || skills.isSaving || isAnalyzing;
  const isDirty = skills.hasUnsavedChanges || hasCustomDraft;

  useEffect(() => {
    onDirtyChange(isDirty);
  }, [isDirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(isBusy);
  }, [isBusy, onBusyChange]);

  async function saveSkills() {
    if (hasCustomDraft) {
      setDraftError(
        'Agrega la habilidad que escribiste o borra el texto antes de guardar.',
      );
      return;
    }
    setDraftError(null);
    if (await skills.saveSkills()) onSaved();
  }

  return (
    <section aria-label="Habilidades en la guía" className="space-y-5">
      {skills.isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          Cargando habilidades...
        </p>
      ) : (
        <SkillsSelector
          catalogSkills={skills.catalogSkills}
          selectedSkills={skills.selectedSkills}
          onAddSkill={skills.addSkill}
          onRemoveSkill={skills.removeSkill}
          onCreateCustomSkill={skills.createCustomSkill}
          onSave={() => void saveSkills()}
          isSaving={skills.isSaving || isAnalyzing}
          hasLoadError={skills.hasLoadError}
          onRetry={() => void skills.reload()}
          feedback={skills.feedback}
          onCustomDraftChange={setHasCustomDraft}
          saveLabel="Guardar cambios"
        />
      )}
      {draftError ? (
        <FeedbackMessage feedback={{ type: 'error', message: draftError }} />
      ) : null}
      <DetectedSkillsPanel forGuide onBusyChange={setIsAnalyzing} />
    </section>
  );
}
