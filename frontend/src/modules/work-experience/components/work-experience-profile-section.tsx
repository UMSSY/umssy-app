"use client";

import { useState } from "react";
import { ConfirmDeleteDialog } from "@/modules/profile";
import { FeedbackMessage } from "@/modules/profile";
import { RecordEditorDialog } from "@/shared/components/layout/record-editor-dialog";
import { WorkExperienceForm } from "../components/work-experience-form";
import { WorkExperienceListCard } from "../components/work-experience-list-card";
import { useDeleteWorkExperience } from "../hooks/use-delete-work-experience";
import { useSaveWorkExperience } from "../hooks/use-save-work-experience";
import { useWorkExperiences } from "../hooks/use-work-experiences";
import type { Feedback } from "@/modules/profile";
import type { WorkExperienceFormValues } from "../types/work-experience-form-values.types";
import type { WorkExperienceItem } from "../types/work-experience-item.types";
import { toWorkExperienceFormValues } from "../utils/to-work-experience-form-values";
import { toWorkExperiencePayload } from "../utils/to-work-experience-payload";

export function WorkExperienceProfileSection() {
  const { experiences, isLoading, error, reload } = useWorkExperiences();
  const [editingExperience, setEditingExperience] = useState<WorkExperienceItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<WorkExperienceItem | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const resetForm = () => {
    setHasChanges(false);
    setIsFormOpen(false);
    setEditingExperience(null);
    setFormVersion((version) => version + 1);
  };

  const saveMutation = useSaveWorkExperience(() => {
    resetForm();
    void reload();
  });

  const deleteMutation = useDeleteWorkExperience((deleted) => {
    if (editingExperience?.id === deleted.id) {
      resetForm();
    }
    void reload();
  });

  const isBusy = saveMutation.isSaving || deleteMutation.isDeleting;

  const listFeedback: Feedback | null =
    deleteMutation.feedback ?? (!isFormOpen ? saveMutation.feedback : null) ?? (error ? { type: "error", message: error } : null);

  const handleEdit = (experience: WorkExperienceItem) => {
    if (isBusy) {
      return;
    }
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setEditingExperience(experience);
    setHasChanges(false);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    if (isBusy) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setEditingExperience(null);
    setFormVersion((version) => version + 1);
    setHasChanges(false);
    setIsFormOpen(true);
  };

  const handleDelete = (experience: WorkExperienceItem) => {
    if (isBusy) {
      return;
    }
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setPendingDelete(experience);
  };

  const handleConfirmDelete = async () => {
    if (pendingDelete) {
      await deleteMutation.deleteWorkExperience(pendingDelete);
    }
    setPendingDelete(null);
  };

  const handleSubmit = async (values: WorkExperienceFormValues) => {
    if (deleteMutation.isDeleting) {
      return;
    }
    deleteMutation.clearFeedback();
    await saveMutation.save(toWorkExperiencePayload(values), editingExperience?.id);
  };

  return (
    <section id="experience" className="scroll-mt-24 space-y-4" aria-label="Experiencia laboral">
      <FeedbackMessage feedback={listFeedback} />

        <WorkExperienceListCard
          onAdd={handleCreate}
          experiences={experiences}
          isLoading={isLoading}
          isBusy={isBusy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      {isFormOpen ? (
        <RecordEditorDialog
          key={formVersion}
          title={editingExperience ? "Editar experiencia" : "Agregar experiencia"}
          description="Completa los datos y guarda para actualizar tu perfil."
          isBusy={saveMutation.isSaving}
          hasUnsavedChanges={hasChanges}
          onClose={resetForm}
        >
          {(requestClose) => (
        <WorkExperienceForm
          key={editingExperience ? editingExperience.id : `new-${formVersion}`}
          initialValues={
            editingExperience ? toWorkExperienceFormValues(editingExperience) : undefined
          }
          isPending={saveMutation.isSaving}
          feedback={saveMutation.feedback}
          onValuesChange={() => setHasChanges(true)}
          onSubmit={handleSubmit}
          onCancel={requestClose}
        />
          )}
        </RecordEditorDialog>
      ) : null}
      <ConfirmDeleteDialog
        isOpen={pendingDelete !== null}
        title="Eliminar experiencia"
        message={`Se eliminará "${pendingDelete?.position ?? ""}" de tu perfil. Esta acción no se puede deshacer.`}
        isDeleting={deleteMutation.isDeleting}
        onConfirm={() => {
          void handleConfirmDelete();
        }}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
