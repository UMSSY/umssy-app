'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackMessage } from '@/modules/profile';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { useDeleteWorkExperience } from '../hooks/use-delete-work-experience';
import { useSaveWorkExperience } from '../hooks/use-save-work-experience';
import { useWorkExperiences } from '../hooks/use-work-experiences';
import type { WorkExperienceFormValues } from '../types/work-experience-form-values.types';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { toWorkExperienceFormValues } from '../utils/to-work-experience-form-values';
import { toWorkExperiencePayload } from '../utils/to-work-experience-payload';
import { WorkExperienceForm } from './work-experience-form';
import { WorkExperienceListCard } from './work-experience-list-card';

export function WorkExperienceGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const { experiences, isLoading, error, reload } = useWorkExperiences();
  const [editingExperience, setEditingExperience] =
    useState<WorkExperienceItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkExperienceItem | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const writingRef = useRef(false);

  function resetForm() {
    setEditingExperience(null);
    setIsFormOpen(false);
    setHasChanges(false);
    setFormVersion((version) => version + 1);
    onDirtyChange(false);
  }

  const saveMutation = useSaveWorkExperience(() => {
    resetForm();
    onSaved();
    void reload();
  });
  const deleteMutation = useDeleteWorkExperience(() => {
    if (editingExperience?.id === pendingDelete?.id) resetForm();
    setPendingDelete(null);
    void reload();
  });
  const isBusy =
    saveMutation.isSaving ||
    saveMutation.isAnalyzing ||
    deleteMutation.isDeleting;

  useEffect(() => {
    onBusyChange(isBusy);
    return () => onBusyChange(false);
  }, [isBusy, onBusyChange]);

  function openForm(experience: WorkExperienceItem | null) {
    if (isBusy || hasChanges) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setPendingDelete(null);
    setEditingExperience(experience);
    setFormVersion((version) => version + 1);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: WorkExperienceFormValues) {
    if (writingRef.current || isBusy) return;
    writingRef.current = true;
    deleteMutation.clearFeedback();
    try {
      await saveMutation.save(
        toWorkExperiencePayload(values),
        editingExperience?.id,
      );
    } finally {
      writingRef.current = false;
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || writingRef.current || isBusy) return;
    writingRef.current = true;
    try {
      await deleteMutation.deleteWorkExperience(pendingDelete);
    } finally {
      writingRef.current = false;
    }
  }

  return (
    <section className="space-y-5" aria-label="Experiencia laboral en la guía">
      <FeedbackMessage
        feedback={
          deleteMutation.feedback ??
          (!isFormOpen ? saveMutation.feedback : null) ??
          (error ? { type: 'error', message: error } : null)
        }
      />
      {error ? (
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Reintentar experiencia
        </Button>
      ) : null}
      {!isLoading && !error && isFormOpen ? (
        <WorkExperienceForm
          key={formVersion}
          initialValues={
            editingExperience
              ? toWorkExperienceFormValues(editingExperience)
              : undefined
          }
          experienceId={editingExperience?.id}
          isPending={isBusy || pendingDelete !== null}
          feedback={saveMutation.feedback}
          saveLabel="Guardar cambios"
          onValuesChange={() => {
            setHasChanges(true);
            onDirtyChange(true);
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (isBusy) return;
            saveMutation.clearFeedback();
            resetForm();
          }}
        />
      ) : null}
      {pendingDelete ? (
        <div
          role="group"
          aria-label="Confirmar eliminación de experiencia"
          className="space-y-3 rounded-md border border-border bg-surface-soft p-4"
        >
          <p className="text-sm text-ink">
            ¿Eliminar «{pendingDelete.position}» de tu experiencia?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setPendingDelete(null)}
            >
              Conservar experiencia
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteMutation.isDeleting
                ? 'Eliminando...'
                : 'Eliminar experiencia'}
            </Button>
          </div>
        </div>
      ) : null}
      <WorkExperienceListCard
        experiences={experiences}
        isLoading={isLoading}
        isBusy={
          isBusy ||
          hasChanges ||
          pendingDelete !== null ||
          isLoading ||
          Boolean(error)
        }
        onAdd={() => openForm(null)}
        onEdit={openForm}
        onDelete={(experience) => {
          saveMutation.clearFeedback();
          deleteMutation.clearFeedback();
          setPendingDelete(experience);
        }}
      />
    </section>
  );
}
