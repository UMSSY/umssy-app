'use client';

import { ArrowLeft, Check, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DocumentDropzoneContent } from '../document/document-dropzone-content';
import { DocumentPreviewContent } from '../document/document-preview-content';
import type { CompanyStepTwoFormProps } from '../../types/company-step-two-form-props.types';

const LETTERHEAD_TIPS = [
  'Documento en hoja membretada oficial de la empresa.',
  'Dirigida a la Dirección de Carrera de Ingeniería de Sistemas e Informática (UMSS).',
  'Firmada y sellada por el representante legal o responsable de RR. HH.',
  'Archivo legible en formato PDF, JPG o PNG (máx. 10 MB).',
];

export function CompanyStepTwoForm({
  documentFile,
  documentPreviewUrl,
  documentError,
  submitting,
  onFileSelected,
  onRemoveDocument,
  onBack,
  onSubmit,
}: CompanyStepTwoFormProps) {
  return (
    <form
      onSubmit={onSubmit}
      className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]"
    >
      <div className="flex flex-col gap-5">
        {documentFile && documentPreviewUrl ? (
          <DocumentPreviewContent
            document={{
              documentType: null,
              fileName: documentFile.name,
              fileSize: documentFile.size,
              mimeType: documentFile.type,
              previewUrl: documentPreviewUrl,
              progress: 100,
              error: documentError,
            }}
            isDisabled={submitting}
            onRemove={onRemoveDocument}
          />
        ) : (
          <DocumentDropzoneContent
            isDisabled={submitting}
            error={documentError}
            onFileSelected={onFileSelected}
          />
        )}

        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={submitting}
            className="h-11 rounded-md px-5 text-sm font-semibold text-ink"
          >
            <ArrowLeft aria-hidden="true" className="mr-1.5 size-4" />
            Volver a datos de la empresa
          </Button>
          <Button
            type="submit"
            disabled={submitting || !documentFile}
            className="h-11 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Enviando solicitud...
              </>
            ) : (
              'Enviar solicitud de empresa'
            )}
          </Button>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-bold text-ink">
          Para que tu solicitud se apruebe sin demoras
        </h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {LETTERHEAD_TIPS.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-ink">
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0 text-accent"
              />
              {tip}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex gap-2 border-t border-border pt-3 text-xs text-text-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Si tu carta es observada, recibirás el motivo por correo y podrás
          subir una nueva.
        </p>
      </aside>
    </form>
  );
}
