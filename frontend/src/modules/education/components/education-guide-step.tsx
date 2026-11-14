'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FeedbackMessage } from '@/modules/profile';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { useDeleteEducation } from '../hooks/use-delete-education';
import { useEducations } from '../hooks/use-educations';
import { useSaveEducation } from '../hooks/use-save-education';
import type { EducationFormValues } from '../types/education-form-values.types';
import type { EducationItem } from '../types/education-item.types';
import { toEducationFormValues } from '../utils/to-education-form-values';
import { toEducationPayload } from '../utils/to-education-payload';
import { toEducationUpdatePayload } from '../utils/to-education-update-payload';
import { EducationForm } from './education-form';
import { EducationListCard } from './education-list-card';

export function EducationGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const { educations, isLoading, error, reload } = useEducations();
  const [editingEducation, setEditingEducation] =
    useState<EducationItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EducationItem | null>(
    null,
  );
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [formVersion, setFormVersion] = useState(0);
  const writingRef = useRef(false);

  function resetForm() {
    setEditingEducation(null);
    setIsFormOpen(false);
    setHasChanges(false);
    setFormVersion((version) => version + 1);
    onDirtyChange(false);
  }

  const saveMutation = useSaveEducation(async () => {
    resetForm();
    onSaved();
    await reload();
  });
  const deleteMutation = useDeleteEducation(async () => {
    if (editingEducation?.id === pendingDelete?.id) resetForm();
    setPendingDelete(null);
    await reload();
  });
  const isBusy = saveMutation.isSaving || deleteMutation.isDeleting;

  useEffect(() => {
    onBusyChange(isBusy);
    return () => onBusyChange(false);
  }, [isBusy, onBusyChange]);

  function openForm(education: EducationItem | null) {
    if (isBusy || hasChanges) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setPendingDelete(null);
    setEditingEducation(education);
    setFormVersion((version) => version + 1);
    setIsFormOpen(true);
  }

  async function handleSubmit(values: EducationFormValues) {
    if (writingRef.current || isBusy) return;
    writingRef.current = true;
    deleteMutation.clearFeedback();
    try {
      if (editingEducation) {
        await saveMutation.save(
          toEducationUpdatePayload(values, editingEducation),
          editingEducation.id,
        );
      } else {
        await saveMutation.save(toEducationPayload(values));
      }
    } finally {
      writingRef.current = false;
    }
  }

  async function confirmDelete() {
    if (!pendingDelete || writingRef.current || isBusy) return;
    writingRef.current = true;
    try {
      await deleteMutation.deleteEducation(pendingDelete);
    } finally {
      writingRef.current = false;
    }
  }

  return (
    <section className="space-y-5" aria-label="Formación académica en la guía">
      <FeedbackMessage
        feedback={
          deleteMutation.feedback ??
          (!isFormOpen ? saveMutation.feedback : null)
        }
      />
      {error ? (
        <Button type="button" variant="outline" onClick={() => void reload()}>
          Reintentar formación
        </Button>
      ) : null}
      {!isLoading && !error && isFormOpen ? (
        <EducationForm
          key={formVersion}
          initialValues={
            editingEducation
              ? toEducationFormValues(editingEducation)
              : undefined
          }
          allowMissingEndDate={editingEducation?.endDate === null}
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
          aria-label="Confirmar eliminación de formación"
          className="space-y-3 rounded-md border border-border bg-surface-soft p-4"
        >
          <p className="text-sm text-ink">
            ¿Eliminar «{pendingDelete.degree}» de tu formación?
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setPendingDelete(null)}
            >
              Conservar formación
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => void confirmDelete()}
            >
              {deleteMutation.isDeleting
                ? 'Eliminando...'
                : 'Eliminar formación'}
            </Button>
          </div>
        </div>
      ) : null}
      <EducationListCard
        educations={educations}
        isLoading={isLoading}
        error={error}
        isBusy={
          isBusy ||
          hasChanges ||
          pendingDelete !== null ||
          isLoading ||
          Boolean(error)
        }
        onAdd={() => openForm(null)}
        onEdit={openForm}
        onDelete={(education) => {
          saveMutation.clearFeedback();
          deleteMutation.clearFeedback();
          setPendingDelete(education);
        }}
      />
    </section>
  );
}
