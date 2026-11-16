'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackMessage } from '@/modules/profile';
import { useProfileGuideEditor } from '@/shared/hooks/use-profile-guide-editor';
import type { ProfileGuideStepProps } from '@/shared/types/profile-guide-step-props.types';
import { DEFAULT_DOCUMENT_TITLE } from '../constants/certification-form.constants';
import { useCertificationDocument } from '../hooks/use-certification-document';
import { useCertifications } from '../hooks/use-certifications';
import { useDeleteCertification } from '../hooks/use-delete-certification';
import { useSaveCertification } from '../hooks/use-save-certification';
import type { Certification } from '../types/certification.types';
import type { CertificationDocumentChange } from '../types/certification-document-change.types';
import type { CreateCertificationDto } from '../types/create-certification-dto.types';
import { CertificationCard } from './certification-card';
import { CertificationDocumentPreviewContent } from './certification-document-viewer';
import { CertificationForm } from './certification-form';
import { CertificationDeleteDialog } from './certification-delete-dialog';

export function CertificationGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const { certifications, isLoading, error, reload } = useCertifications({
    forGuide: true,
  });
  const document = useCertificationDocument();
  const remove = useDeleteCertification();
  const save = useSaveCertification({ onPersisted: () => {} });
  const editor = useProfileGuideEditor<Certification>({
    isBusy: isLoading || remove.isDeleting || document.isOpening,
    initiallyOpen: false,
    onDirtyChange,
    onBusyChange,
  });
  const { editingItem, pendingDelete, hasChanges, isBusy } = editor;
  const blockActions = isBusy || hasChanges;
  const feedback =
    save.feedback ??
    remove.feedback ??
    document.feedback ??
    (error ? { type: 'error' as const, message: error } : null);

  function openEditor(certification: Certification | null) {
    if (!editor.openForm(certification)) return;
    save.clearFeedback();
    remove.clearFeedback();
    document.clearFeedback();
  }

  function cancelEditor() {
    editor.cancelForm();
  }

  async function saveCertification(
    values: CreateCertificationDto,
    change: CertificationDocumentChange,
  ) {
    const result = await editor.runWrite(async () => {
      const result = await save.save(editingItem?.id ?? null, values, change);
      if (result.status === 'failed') return result.fileError;
      editor.resetForm();
      await reload();
      onSaved();
      return null;
    });
    return result ?? null;
  }

  async function deleteCertification() {
    if (!pendingDelete) return;
    await editor.runWrite(async () => {
      if (await remove.deleteCertification(pendingDelete)) {
        editor.completeDelete();
        await reload();
      }
    });
  }

  return (
    <section aria-label="Certificaciones en la guía" className="space-y-5">
      <FeedbackMessage feedback={feedback} />
      {isLoading ? (
        <p role="status" className="text-sm text-text-secondary">
          Cargando certificaciones...
        </p>
      ) : null}
      {error ? (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy}
          onClick={() => void reload()}
        >
          Volver a intentar
        </Button>
      ) : null}
      {!isLoading && !error && certifications.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Agrega tus certificaciones con su documento de respaldo. Puedes omitir
          este paso si aún no tienes una.
        </p>
      ) : null}
      {certifications.length > 0 ? (
        <ul
          aria-label="Certificaciones guardadas"
          className="divide-y divide-border"
        >
          {certifications.map((certification) => (
            <li key={certification.id}>
              <CertificationCard
                certification={certification}
                isBusy={blockActions}
                onEdit={openEditor}
                onDelete={editor.requestDelete}
                onViewDocument={(item) => void document.openDocument(item)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      <CertificationDeleteDialog
        certification={pendingDelete}
        isDeleting={isBusy}
        onConfirm={() => void deleteCertification()}
        onCancel={editor.cancelDelete}
      />
      {editor.isFormOpen ? (
        <CertificationForm
          key={editor.formVersion}
          initialData={
            editingItem
              ? {
                  name: editingItem.name,
                  issuingOrganization: editingItem.issuingOrganization,
                  issueDate: editingItem.issueDate,
                }
              : undefined
          }
          currentDocumentName={
            editingItem?.hasDocument
              ? (editingItem.document?.fileName ?? DEFAULT_DOCUMENT_TITLE)
              : undefined
          }
          onSubmit={saveCertification}
          onCancel={cancelEditor}
          onDirtyChange={editor.setDirty}
          onBusyChange={editor.setIsFormBusy}
          saveLabel="Guardar cambios"
        />
      ) : (
        <Button
          type="button"
          variant="outline"
          disabled={isBusy || Boolean(error)}
          onClick={() => openEditor(null)}
        >
          <Plus aria-hidden="true" />
          Agregar certificación
        </Button>
      )}
      {document.preview ? (
        <section aria-label="Documento de respaldo" className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-ink">
              {document.preview.fileName}
            </h3>
            <Button
              type="button"
              variant="outline"
              onClick={document.closeDocument}
            >
              Cerrar documento
            </Button>
          </div>
          <CertificationDocumentPreviewContent preview={document.preview} />
        </section>
      ) : null}
    </section>
  );
}
