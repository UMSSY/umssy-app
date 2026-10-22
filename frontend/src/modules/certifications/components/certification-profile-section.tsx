"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CertificationCard } from "../components/certification-card";
import { CertificationDeleteDialog } from "../components/certification-delete-dialog";
import { CertificationDocumentViewer } from "../components/certification-document-viewer";
import { CertificationForm } from "../components/certification-form";
import { DEFAULT_DOCUMENT_TITLE } from "../constants/certification-form.constants";
import { FeedbackMessage } from "@/modules/profile";
import { RecordEditorDialog } from "@/shared/components/layout/record-editor-dialog";
import { Plus } from "lucide-react";
import { SectionCard } from "@/modules/profile";
import { useCertificationDocument } from "../hooks/use-certification-document";
import { useCertifications } from "../hooks/use-certifications";
import { useDeleteCertification } from "../hooks/use-delete-certification";
import { useSaveCertification } from "../hooks/use-save-certification";
import type { Certification } from "../types/certification.types";
import type { CertificationDocumentChange } from "../types/certification-document-change.types";
import type { CreateCertificationDto } from "../types/create-certification-dto.types";
import type { Feedback } from "@/modules/profile";

function toFormValues(certification: Certification): CreateCertificationDto {
  return {
    name: certification.name,
    issuingOrganization: certification.issuingOrganization,
    issueDate: certification.issueDate,
  };
}

export function CertificationProfileSection() {
  const { certifications, isLoading, error, reload } = useCertifications();
  const [isCreating, setIsCreating] = useState(false);
  const [editing, setEditing] = useState<Certification | null>(null);
  const [formVersion, setFormVersion] = useState(0);
  const formVersionRef = useRef(0);
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const deleteMutation = useDeleteCertification(() => {
    void reload();
  });
  const certificationDocument = useCertificationDocument();
  const saveCertification = useSaveCertification({
    applyDocumentChange: certificationDocument.applyDocumentChange,
    onPersisted: () => {
      void reload();
    },
  });

  const isOpeningDocument = certificationDocument.isOpening;
  const visibleFeedback: Feedback | null =
    saveCertification.feedback ??
    certificationDocument.feedback ??
    deleteMutation.feedback ??
    (error ? { type: "error", message: error } : null);

  const clearFeedback = () => {
    saveCertification.clearFeedback();
    deleteMutation.clearFeedback();
    certificationDocument.clearFeedback();
  };

  const startNewFormVersion = () => {
    setHasChanges(false);
    formVersionRef.current += 1;
    setFormVersion(formVersionRef.current);
  };

  const openEditForm = (certification: Certification) => {
    clearFeedback();
    saveCertification.reset();
    setIsCreating(false);
    setEditing(certification);
    startNewFormVersion();
  };

  const closeForm = () => {
    saveCertification.reset();
    setEditing(null);
    setIsCreating(false);
    startNewFormVersion();
  };

  const openCreateForm = () => {
    clearFeedback();
    saveCertification.reset();
    setEditing(null);
    setIsCreating(true);
    startNewFormVersion();
  };

  const handleSubmit = async (
    values: CreateCertificationDto,
    change: CertificationDocumentChange,
  ): Promise<string | null> => {
    const submittedVersion = formVersionRef.current;
    setIsSaving(true);
    let result;
    try { result = await saveCertification.save(editing?.id ?? null, values, change); }
    finally { setIsSaving(false); }
    if (result.status === "failed") {
      return result.fileError;
    }

    if (submittedVersion === formVersionRef.current) {
      closeForm();
    }
    return null;
  };

  const openDeleteDialog = (certification: Certification) => {
    clearFeedback();
    setPendingDelete(certification);
  };

  const handleConfirmDelete = async (certification: Certification) => {
    const wasDeleted = await deleteMutation.deleteCertification(certification);
    if (wasDeleted && editing?.id === certification.id) {
      closeForm();
    }
    setPendingDelete(null);
  };

  const handleViewDocument = (certification: Certification) => {
    clearFeedback();
    void certificationDocument.openDocument(certification);
  };

  const getCurrentDocumentName = (certification: Certification | null) => {
    if (!certification?.hasDocument) {
      return undefined;
    }
    return certificationDocument.uploadedInfo[certification.id]?.fileName ?? DEFAULT_DOCUMENT_TITLE;
  };

  const renderAddButton = (className: string) => (
    <Button
      type="button"
      className={className}
      variant="outline"
      disabled={isSaving || deleteMutation.isDeleting || isOpeningDocument}
      onClick={openCreateForm}
    >
      <Plus aria-hidden="true" />Agregar certificación
    </Button>
  );

  const renderList = () => {
    if (isLoading) {
      return <p className="py-3 text-sm text-text-secondary">Cargando certificaciones...</p>;
    }

    if (certifications.length === 0) {
      return error ? null : (
        <div className="flex flex-col items-start gap-4 py-3">
          <p className="text-sm text-text-secondary">Aún no has agregado certificaciones.</p>
        </div>
      );
    }

    return (
      <ul aria-label="Certificaciones" className="flex flex-col divide-y divide-border">
        {certifications.map((certification) => (
          <li key={certification.id}>
            <CertificationCard
              certification={certification}
              isBusy={isSaving || deleteMutation.isDeleting || isOpeningDocument}
              onEdit={openEditForm}
              onDelete={openDeleteDialog}
              onViewDocument={handleViewDocument}
            />
          </li>
        ))}
      </ul>
    );
  };

  return (
    <section id="certifications" aria-label="Certificaciones" className="scroll-mt-24 space-y-4">
      {visibleFeedback && !(isCreating || editing) ? <FeedbackMessage feedback={visibleFeedback} /> : null}
      <SectionCard title="Certificaciones" action={renderAddButton("h-8 gap-2 px-3 text-sm")}>
        {renderList()}
      </SectionCard>
      {isCreating || editing ? (
        <RecordEditorDialog
          key={formVersion}
          title={editing ? "Editar certificación" : "Agregar certificación"}
          description="Registra tu certificación y adjunta su documento de respaldo."
          isBusy={isSaving}
          hasUnsavedChanges={hasChanges}
          onClose={closeForm}
        >
          {(requestClose) => <>
            <FeedbackMessage feedback={visibleFeedback} />
            <CertificationForm
              initialData={editing ? toFormValues(editing) : undefined}
              currentDocumentName={getCurrentDocumentName(editing)}
              onValuesChange={() => setHasChanges(true)}
              onSubmit={handleSubmit}
              onCancel={requestClose}
            />
          </>}
        </RecordEditorDialog>
      ) : null}
      <CertificationDocumentViewer preview={certificationDocument.preview} onClose={certificationDocument.closeDocument} />
      <CertificationDeleteDialog certification={pendingDelete} isDeleting={deleteMutation.isDeleting} onConfirm={handleConfirmDelete} onCancel={() => setPendingDelete(null)} />
    </section>
  );
}
