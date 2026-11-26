"use client";

import { Check, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  COMPANY_CORRECTION_MISSING_TOKEN_MESSAGE,
  COMPANY_STATUS_LABELS,
} from "../../constants/company-request-status.constants";
import { DOCUMENT_RECOMMENDATIONS } from "../../constants/document-recommendations.constants";
import type { CompanyRequestStatusDetailsProps } from "../../types/company-request-status-details-props.types";
import { formatSubmissionDate } from "../../utils/format-submission-date";

export function CompanyRequestStatusDetails({
  request,
  onStartCorrection,
}: CompanyRequestStatusDetailsProps) {
  const statusLabel = COMPANY_STATUS_LABELS[request.status] ?? "Estado no disponible";
  const reasonText = request.reason?.trim() ?? "";
  const [reasonTitle, ...reasonLines] = reasonText.split(/\r?\n/);
  const reasonDescription = reasonLines.join("\n").trim();

  const fields = [
    { label: "Código de solicitud", value: request.requestCode ?? "Sin código" },
    { label: "Empresa", value: request.companyName },
    { label: "Fecha de envío", value: formatSubmissionDate(request.submittedAt) ?? "Fecha no disponible" },
    ...(request.reviewedAt
      ? [{ label: "Fecha de revisión", value: formatSubmissionDate(request.reviewedAt) ?? "Fecha no disponible" }]
      : []),
  ];

  return (
    <section
      aria-label="Detalle de la solicitud"
      className="flex w-full flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
    >
      <h2 className="text-xl font-bold text-ink">Detalle de la solicitud</h2>

      <p role="status" className="text-base font-semibold text-ink">
        {`Estado: ${statusLabel}`}
      </p>

      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.label} className="flex flex-col gap-1">
            <dt className="text-sm font-semibold text-text-secondary">{field.label}</dt>
            <dd className="text-base text-ink">{field.value}</dd>
          </div>
        ))}
      </dl>

      {reasonText ? (
        <div className="rounded-md bg-danger/5 px-4 py-3">
          <h3 aria-label="Motivo de la revisión" className="text-base leading-snug font-bold text-danger">
            Motivo: <span>{reasonTitle}</span>
          </h3>
          {reasonDescription ? (
            <p className="mt-1 text-base leading-snug whitespace-pre-wrap text-ink">{reasonDescription}</p>
          ) : null}
        </div>
      ) : null}

      {request.canResubmit ? (
        <>
          <aside
            aria-label="Antes de volver a subirlo"
            className="rounded-lg border border-border bg-surface p-4 sm:p-5"
          >
            <h2 className="font-tight text-lg font-bold text-ink">Antes de volver a subirlo</h2>
            <ul className="mt-3 flex flex-col gap-3">
              {DOCUMENT_RECOMMENDATIONS.map((tip) => (
                <li key={tip} className="flex items-start gap-2 text-sm text-ink">
                  <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </aside>

          <div className="flex flex-col items-center gap-2">
            <Button
              type="button"
              disabled={!onStartCorrection}
              onClick={onStartCorrection}
              className="h-11 w-full rounded-md px-6 font-semibold sm:w-auto sm:min-w-80"
            >
              <FilePlus2 aria-hidden="true" className="size-4" />
              Subir un nuevo documento
            </Button>
            {!onStartCorrection ? (
              <p className="text-sm text-text-secondary">{COMPANY_CORRECTION_MISSING_TOKEN_MESSAGE}</p>
            ) : null}
          </div>
        </>
      ) : null}
    </section>
  );
}
