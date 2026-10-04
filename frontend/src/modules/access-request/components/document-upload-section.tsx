'use client';

import { useEffect, useState } from 'react';

import { useDeleteDocument, useUploadDocument } from '../hooks/use-document-upload';
import { DocumentPreview } from './document-preview';
import { UploadedDocumentCard } from './uploaded-document-card';

export function DocumentUploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const upload = useUploadDocument();
  const remove = useDeleteDocument();

  // Libera la URL del objeto cuando cambia o cuando se desmonta el componente
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function clearSelection() {
    setFile(null);
    setPreviewUrl(null);
    setDocumentId(null);
    setErrorMessage(null);
    upload.reset();
  }

  function handleFileSelected(selected: File) {
    setErrorMessage(null);
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));

    upload.mutate(selected, {
      onSuccess: (document) => setDocumentId(document.id),
      onError: () => {
        clearSelection();
        setErrorMessage('No se pudo subir el documento. Intenta de nuevo.');
      },
    });
  }

  function handleView() {
    if (previewUrl) window.open(previewUrl, '_blank', 'noopener');
  }

  function handleRemove() {
    if (!documentId) {
      clearSelection();
      return;
    }
    remove.mutate(documentId, {
      onSuccess: clearSelection,
      onError: () => setErrorMessage('No se pudo quitar el documento. Intenta de nuevo.'),
    });
  }

  const isUploaded = documentId !== null;

  return (
    <section className="space-y-4">
      {!file && (
        // TODO: reemplazar por la zona de arrastrar y soltar de 1.1.2-F1
        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-300 p-8 text-sm text-slate-500">
          Selecciona tu archivo (PDF, JPG o PNG, hasta 10 MB)
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files?.[0];
              if (selected) handleFileSelected(selected);
            }}
          />
        </label>
      )}

      {file && (
        <UploadedDocumentCard
          fileName={file.name}
          fileSize={file.size}
          progress={upload.progress}
          isUploading={upload.isPending}
          isRemoving={remove.isPending}
          onView={handleView}
          onRemove={handleRemove}
        />
      )}

      {file && previewUrl && isUploaded && (
        <DocumentPreview url={previewUrl} mimeType={file.type} fileName={file.name} />
      )}

      {errorMessage && (
        <p role="alert" className="text-sm font-semibold text-red-700">
          {errorMessage}
        </p>
      )}
    </section>
  );
}