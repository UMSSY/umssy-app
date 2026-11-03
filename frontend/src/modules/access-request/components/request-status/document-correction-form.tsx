"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useDocumentCorrection } from "../../hooks/use-document-correction";
import type { DocumentCorrectionFormProps } from "../../types/document-correction.types";
import { DocumentDropzoneContent } from "../document/document-dropzone-content";
import { DocumentPreviewContent } from "../document/document-preview-content";
import { DocumentTypeField } from "../document/document-type-field";

export function DocumentCorrectionForm(props: DocumentCorrectionFormProps) {
  const correction = useDocumentCorrection(props);

  return (
    <form
      aria-label="Corrección del documento"
      onSubmit={(event) => { event.preventDefault(); void correction.submit(); }}
      className="flex flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-ink">Subir un nuevo documento</h2>
        <p className="text-sm text-text-secondary">
          Revisa el archivo antes de enviarlo. Puedes quitarlo y elegir otro o cancelar la selección.
        </p>
      </div>

      <DocumentTypeField
        id="correction-document-type"
        value={correction.documentType}
        onChange={correction.selectType}
        isDisabled={correction.isSubmitting}
        error={correction.typeError}
      />

      {correction.document ? (
        <DocumentPreviewContent
          document={correction.document}
          isDisabled={correction.isSubmitting}
          onRemove={correction.removeFile}
        />
      ) : (
        <DocumentDropzoneContent
          isDisabled={correction.isSubmitting}
          error={correction.fileError}
          onFileSelected={correction.selectFile}
        />
      )}

      {correction.isSubmitting ? (
        <div role="status" className="flex flex-col gap-2">
          <Progress value={correction.progress} aria-label="Progreso del reenvío" />
          <p className="text-sm text-text-secondary">Enviando documento...</p>
        </div>
      ) : null}

      {correction.submitError ? (
        <Alert className="border-danger/25 bg-surface text-danger">
          <AlertTitle>No se pudo reenviar el documento</AlertTitle>
          <AlertDescription className="text-danger">{correction.submitError}</AlertDescription>
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <Button type="button" variant="ghost" disabled={correction.isSubmitting} onClick={correction.cancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={correction.isSubmitting} className="h-11 rounded-md px-5 font-semibold">
          {correction.isSubmitting ? "Enviando..." : "Enviar documento"}
        </Button>
      </div>
    </form>
  );
}
