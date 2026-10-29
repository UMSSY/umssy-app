"use client";

import { ArrowLeft, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useAccessRequestForm } from "../../contexts/access-request-context";
import { DocumentDropzone } from "./document-dropzone";
import { DocumentTypeField } from "./document-type-field";
import { DocumentPreviewCard } from "./document-preview-card";
import { FieldError } from "../personal-data/field-error";
import { DOCUMENT_RECOMMENDATIONS } from "../../constants/document-recommendations.constants";

export function DocumentStep() {
  const { values, status, document: documentState, hasDocument, submitError, goToStep, selectDocumentType, submitRequest } =
    useAccessRequestForm();
  const fullName = [values.firstName.trim(), values.lastName.trim()].filter(Boolean).join(" ");
  const isIdle = status === "idle";

  return (
    <div className="grid w-full grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex flex-col gap-5">
        <PageHeading
          title="Documento de respaldo"
          description={`El nombre del documento debe coincidir con el que escribiste en el paso anterior: ${fullName}`}
        />

        <DocumentTypeField
          value={documentState.documentType}
          onChange={selectDocumentType}
          isDisabled={hasDocument || !isIdle}
        />

        {hasDocument ? <DocumentPreviewCard /> : <DocumentDropzone />}

        {submitError ? (
          <div role="alert">
            <FieldError id="submit-error" message={submitError} />
          </div>
        ) : null}

        <div className="flex w-full flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <Button
            type="button"
            variant="ghost"
            disabled={!isIdle}
            onClick={() => goToStep(1)}
            className="h-11 rounded-md px-5 text-sm font-semibold text-ink"
          >
            <ArrowLeft aria-hidden="true" />
            Volver a mis datos
          </Button>
          <Button
            type="button"
            disabled={!hasDocument || !isIdle}
            onClick={() => void submitRequest()}
            className="h-11 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-brand-hover"
          >
            {status === "sending" ? "Enviando..." : "Enviar solicitud"}
          </Button>
        </div>
      </div>

      <aside className="h-fit rounded-lg border border-border bg-surface p-5">
        <h2 className="text-base font-bold text-ink">Para que tu solicitud se apruebe sin demoras</h2>
        <ul className="mt-3 flex flex-col gap-2.5">
          {DOCUMENT_RECOMMENDATIONS.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-ink">
              <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
        <p className="mt-4 flex gap-2 border-t border-border pt-3 text-xs text-text-secondary">
          <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          Si tu documento es rechazado, recibirás el motivo por correo y podrás subir otro.
        </p>
      </aside>
    </div>
  );
}
