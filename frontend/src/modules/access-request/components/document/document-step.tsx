"use client";

import { ArrowLeft, Check, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SELECT_ITEM_CONTRAST_CLASS } from "@/shared/constants/select.constants";
import type { DocumentType } from "../../constants/document-types.constants";
import { useAccessRequestForm } from "../../contexts/access-request-context";
import { DocumentDropzone } from "./document-dropzone";
import { DocumentPreviewCard } from "./document-preview-card";
import { FieldError } from "../personal-data/field-error";
import { RequiredMark } from "../personal-data/required-mark";
import { DOCUMENT_RECOMMENDATIONS } from "../../constants/document-recommendations.constants";

const DOCUMENT_TYPE_OPTIONS: ReadonlyArray<{ value: DocumentType; label: string }> = [
  { value: "academic_diploma", label: "Diploma académico" },
  { value: "national_title", label: "Título en provisión nacional" },
];

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

        <div>
          <Label htmlFor="documentType" className="mb-1.5 text-xs font-semibold text-ink">
            Tipo de documento
            <RequiredMark />
          </Label>
          <Select
            name="documentType"
            items={DOCUMENT_TYPE_OPTIONS}
            value={documentState.documentType || null}
            onValueChange={(value) => {
              if (value) selectDocumentType(value as DocumentType);
            }}
            disabled={hasDocument || !isIdle}
          >
            <SelectTrigger
              id="documentType"
              aria-required="true"
              className="w-full rounded-md border-border bg-surface px-3 text-base text-ink focus-visible:border-accent focus-visible:ring-interaction data-[size=default]:h-11"
            >
              <SelectValue placeholder="Elige el tipo de documento" />
            </SelectTrigger>
            <SelectContent alignItemWithTrigger={false}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className={SELECT_ITEM_CONTRAST_CLASS}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
