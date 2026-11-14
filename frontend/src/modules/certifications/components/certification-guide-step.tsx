'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FeedbackMessage } from '@/modules/profile';
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

export function CertificationGuideStep({
  onSaved,
  onDirtyChange,
  onBusyChange,
}: ProfileGuideStepProps) {
  const { certifications, isLoading, error, reload } = useCertifications({
    forGuide: true,
  });
  const [editor, setEditor] = useState<Certification | null | undefined>();
  const [pendingDelete, setPendingDelete] = useState<Certification | null>(
    null,
  );
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormBusy, setIsFormBusy] = useState(false);
  const document = useCertificationDocument();
  const remove = useDeleteCertification();
  const save = useSaveCertification({ onPersisted: () => {} });
  const isBusy =
    isLoading ||
    isSaving ||
    isFormBusy ||
    remove.isDeleting ||
    document.isOpening;
  const blockActions = isBusy || hasChanges;
  const feedback =
    save.feedback ??
    remove.feedback ??
    document.feedback ??
    (error ? { type: 'error' as const, message: error } : null);

  useEffect(() => {
    onDirtyChange(hasChanges);
  }, [hasChanges, onDirtyChange]);
  useEffect(() => {
    onBusyChange(isBusy);
  }, [isBusy, onBusyChange]);

  function openEditor(certification: Certification | null) {
    save.clearFeedback();
    remove.clearFeedback();
    document.clearFeedback();
    setPendingDelete(null);
    setHasChanges(false);
    setEditor(certification);
  }

  function cancelEditor() {
    setEditor(undefined);
    setHasChanges(false);
    setIsFormBusy(false);
  }

  async function saveCertification(
    values: CreateCertificationDto,
    change: CertificationDocumentChange,
  ) {
    setIsSaving(true);
    try {
      const result = await save.save(editor?.id ?? null, values, change);
      if (result.status === 'failed') return result.fileError;
      cancelEditor();
      await reload();
      onSaved();
      return null;
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteCertification() {
    if (!pendingDelete) return;
    if (await remove.deleteCertification(pendingDelete)) {
      setPendingDelete(null);
      await reload();
    }
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
                onDelete={setPendingDelete}
                onViewDocument={(item) => void document.openDocument(item)}
              />
            </li>
          ))}
        </ul>
      ) : null}
      {pendingDelete ? (
        <div
          role="group"
          aria-label="Confirmar eliminación de certificación"
          className="space-y-3 rounded-lg border border-border p-4"
        >
          <p className="text-sm text-ink">
            ¿Eliminar {pendingDelete.name} de tu perfil?
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              variant="destructive"
              disabled={isBusy}
              onClick={() => void deleteCertification()}
            >
              Eliminar certificación
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setPendingDelete(null)}
            >
              Cancelar eliminación
            </Button>
          </div>
        </div>
      ) : null}
      {editor !== undefined ? (
        <CertificationForm
          key={editor?.id ?? 'new'}
          initialData={
            editor
              ? {
                  name: editor.name,
                  issuingOrganization: editor.issuingOrganization,
                  issueDate: editor.issueDate,
                }
              : undefined
          }
          currentDocumentName={
            editor?.hasDocument
              ? (editor.document?.fileName ?? DEFAULT_DOCUMENT_TITLE)
              : undefined
          }
          onSubmit={saveCertification}
          onCancel={cancelEditor}
          onDirtyChange={setHasChanges}
          onBusyChange={setIsFormBusy}
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
