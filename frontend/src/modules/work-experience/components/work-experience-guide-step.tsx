'use client';

import { Button } from '@/components/ui/button';
import { ConfirmDeleteDialog, FeedbackMessage } from '@/modules/profile';
import { useProfileGuideEditor } from '@/shared/hooks/use-profile-guide-editor';
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
  const { experiences, isLoading, error, reload } = useWorkExperiences({
    forGuide: true,
  });
  const editor = useProfileGuideEditor<WorkExperienceItem>({
    onDirtyChange,
    onBusyChange,
  });
  const { editingItem: editingExperience, pendingDelete, isFormOpen, hasChanges, formVersion, isBusy } = editor;
  const saveMutation = useSaveWorkExperience(
    () => {
      editor.resetForm();
      onSaved();
      void reload();
    },
    { forGuide: true },
  );
  const deleteMutation = useDeleteWorkExperience(() => {
    editor.completeDelete();
    void reload();
  });
  function openForm(experience: WorkExperienceItem | null) {
    if (!editor.openForm(experience)) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
  }

  async function handleSubmit(values: WorkExperienceFormValues) {
    await editor.runWrite(async () => {
      deleteMutation.clearFeedback();
      await saveMutation.save(
        toWorkExperiencePayload(values),
        editingExperience?.id,
      );
    });
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    await editor.runWrite(async () => {
      await deleteMutation.deleteWorkExperience(pendingDelete);
    });
  }

  return (
    <section className="space-y-5" aria-label="Experiencia laboral en la guía">
      {saveMutation.isAnalyzing ? (
        <p role="status" className="text-sm text-text-secondary">
          Analizando las habilidades de tu experiencia en segundo plano. Puedes
          continuar con tu perfil.
        </p>
      ) : null}
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
            editor.setDirty(true);
          }}
          onSubmit={handleSubmit}
          onCancel={() => {
            if (!editor.cancelForm()) return;
            saveMutation.clearFeedback();
          }}
        />
      ) : null}
      <ConfirmDeleteDialog
        isOpen={pendingDelete !== null}
        title="Eliminar experiencia"
        message={`Se eliminará "${pendingDelete?.position ?? ''}" de tu perfil. Esta acción no se puede deshacer.`}
        isDeleting={isBusy}
        onConfirm={() => void confirmDelete()}
        onCancel={editor.cancelDelete}
      />
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
          if (!editor.requestDelete(experience)) return;
          saveMutation.clearFeedback();
          deleteMutation.clearFeedback();
        }}
      />
    </section>
  );
}
