"use client";

import { useState } from "react";
import { EducationDeleteDialog } from "../components/education-delete-dialog";
import { EducationForm } from "../components/education-form";
import { EducationListCard } from "../components/education-list-card";
import { FeedbackMessage } from "@/modules/profile";
import { RecordEditorDialog } from "@/shared/components/layout/record-editor-dialog";
import { useDeleteEducation } from "../hooks/use-delete-education";
import { useEducations } from "../hooks/use-educations";
import { useSaveEducation } from "../hooks/use-save-education";
import type { EducationFormValues } from "../types/education-form-values.types";
import type { EducationItem } from "../types/education-item.types";
import { toEducationFormValues } from "../utils/to-education-form-values";
import { toEducationPayload } from "../utils/to-education-payload";
import { toEducationUpdatePayload } from "../utils/to-education-update-payload";

export function EducationProfileSection() {
  const { educations, isLoading, error, reload } = useEducations();
  const [editingEducation, setEditingEducation] = useState<EducationItem | null>(null);
  const [pendingDelete, setPendingDelete] = useState<EducationItem | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formVersion, setFormVersion] = useState(0);

  const resetForm = () => {
    setHasChanges(false);
    setIsFormOpen(false);
    setEditingEducation(null);
    setFormVersion((version) => version + 1);
  };

  const saveMutation = useSaveEducation(() => {
    resetForm();
    return reload();
  });

  const deleteMutation = useDeleteEducation(reload);

  const isBusy = saveMutation.isSaving || deleteMutation.isDeleting || pendingDelete !== null;

  const handleCancel = () => {
    if (isBusy) return;
    saveMutation.clearFeedback();
    resetForm();
  };

  const handleEdit = (education: EducationItem) => {
    if (isBusy) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setEditingEducation(education);
    setHasChanges(false);
    setIsFormOpen(true);
    setFormVersion((version) => version + 1);
  };

  const handleCreate = () => {
    if (isBusy) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setEditingEducation(null);
    setFormVersion((version) => version + 1);
    setHasChanges(false);
    setIsFormOpen(true);
  };

  const handleDelete = (education: EducationItem) => {
    if (isBusy) return;
    saveMutation.clearFeedback();
    deleteMutation.clearFeedback();
    setPendingDelete(education);
  };

  const handleSubmit = async (values: EducationFormValues) => {
    if (isBusy) return;
    deleteMutation.clearFeedback();
    if (editingEducation) {
      await saveMutation.save(toEducationUpdatePayload(values, editingEducation), editingEducation.id);
    } else {
      await saveMutation.save(toEducationPayload(values));
    }
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete || deleteMutation.isDeleting) {
      return;
    }
    const deleted = await deleteMutation.deleteEducation(pendingDelete);
    if (!deleted) return;
    if (editingEducation?.id === pendingDelete.id) {
      resetForm();
    }
    setPendingDelete(null);
  };

  return (
    <section id="education" className="scroll-mt-24 space-y-4" aria-label="Formación académica">
      <FeedbackMessage feedback={pendingDelete ? null : deleteMutation.feedback ?? (!isFormOpen ? saveMutation.feedback : null)} />

        <EducationListCard
          onAdd={handleCreate}
          educations={educations}
          isLoading={isLoading}
          error={error}
          isBusy={isBusy}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      {isFormOpen ? (
        <RecordEditorDialog
          key={formVersion}
          title={editingEducation ? "Editar formación" : "Agregar formación"}
          description="Completa los datos y guarda para actualizar tu perfil."
          isBusy={saveMutation.isSaving}
          hasUnsavedChanges={hasChanges}
          onClose={handleCancel}
        >
          {(requestClose) => (
        <EducationForm
          key={`${editingEducation?.id ?? "new"}-${formVersion}`}
          initialValues={editingEducation ? toEducationFormValues(editingEducation) : undefined}
          allowMissingEndDate={editingEducation?.endDate === null}
          isPending={saveMutation.isSaving}
          feedback={saveMutation.feedback}
          onValuesChange={() => setHasChanges(true)}
          onSubmit={handleSubmit}
          onCancel={requestClose}
        />
          )}
        </RecordEditorDialog>
      ) : null}
      <EducationDeleteDialog
        isOpen={pendingDelete !== null}
        degree={pendingDelete?.degree ?? ""}
        feedback={deleteMutation.feedback}
        isDeleting={deleteMutation.isDeleting}
        onConfirm={() => void handleConfirmDelete()}
        onCancel={() => { if (!deleteMutation.isDeleting) setPendingDelete(null); }}
      />
    </section>
  );
}
