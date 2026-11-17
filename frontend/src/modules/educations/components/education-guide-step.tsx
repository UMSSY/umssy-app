'use client';

import { Button } from '@/components/ui/button';
import { FeedbackMessage } from '@/modules/profile';
import { useProfileGuideEditor } from '@/shared/hooks/use-profile-guide-editor';
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
import { EducationDeleteDialog } from './education-delete-dialog';

export function EducationGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const { educations, isLoading, error, reload } = useEducations({
    forGuide: true,
  });
  const editor = useProfileGuideEditor<EducationItem>({
    onDirtyChange,
    onBusyChange,
  });
  const { editingItem: editingEducation, pendingDelete, isFormOpen, hasChanges, formVersion, isBusy } = editor;
  const saveMutation = useSaveEducation(async () => {
    editor.resetForm();
    onSaved();
    await reload();
  });
  const deleteMutation = useDeleteEducation(async () => {
    editor.completeDelete();
    await reload();
  });
  function openForm(education: EducationItem | null) {
    if (!editor.openForm(education)) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
  }

  async function handleSubmit(values: EducationFormValues) {
    await editor.runWrite(async () => {
      deleteMutation.clearFeedback();
      if (editingEducation) {
        await saveMutation.save(
          toEducationUpdatePayload(values, editingEducation),
          editingEducation.id,
        );
      } else {
        await saveMutation.save(toEducationPayload(values));
      }
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await editor.runWrite(async () => {
      await deleteMutation.deleteEducation(pendingDelete);
    });
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
            editor.setDirty(true);
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!editor.cancelForm()) return;
            saveMutation.clearFeedback();
          }}
        />
      ) : null}
      <EducationDeleteDialog
        isOpen={pendingDelete !== null}
        degree={pendingDelete?.degree ?? ''}
        isDeleting={isBusy}
        feedback={deleteMutation.feedback}
        onConfirm={() => void confirmDelete()}
        onCancel={editor.cancelDelete}
      />
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
          if (!editor.requestDelete(education)) return;
          saveMutation.clearFeedback();
          deleteMutation.clearFeedback();
        }}
      />
    </section>
  );
}
