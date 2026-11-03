"use client";

import { Check, CircleX, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DOCUMENT_RECOMMENDATIONS } from "../../constants/document-recommendations.constants";
import type { RequestStatusDetailsProps } from "../../types/request-status-details-props.types";
import { formatSubmissionDate } from "../../utils/format-submission-date";

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  pending: "En revisión",
  in_review: "En revisión",
  approved: "Aprobada",
  rejected: "Necesitamos otro documento",
};

export function RequestStatusDetails({
  requestCode,
  status,
  fullName,
  submittedAt,
  reviewedAt,
  rejectionReason,
  onStartCorrection,
}: RequestStatusDetailsProps) {
  const isRejected = status === "rejected";
  const statusLabel = STATUS_LABELS[status] ?? "Estado no disponible";

  const dateFields = [
    {
      label: "Fecha de envío",
      value: formatSubmissionDate(submittedAt) ?? "Fecha no disponible",
    },
    ...(reviewedAt
      ? [
          {
            label: "Fecha de revisión",
            value:
              formatSubmissionDate(reviewedAt) ?? "Fecha no disponible",
          },
        ]
      : []),
  ];

  // Conserva la zona horaria del formateador compartido y omite el año
  // únicamente en la línea compacta del rechazo.
  const reviewDate =
    formatSubmissionDate(reviewedAt)?.replace(/ \d{4}(?=,)/, "") ?? null;

  const reasonText =
    rejectionReason?.trim() || "No hay un motivo disponible.";

  // Presenta la primera línea destacada y conserva el resto del mensaje.
  const [reasonTitle, ...reasonLines] = reasonText.split(/\r?\n/);
  const reasonDescription = reasonLines.join("\n").trim();

  if (!isRejected) {
    const fields = [
      { label: "Código de solicitud", value: requestCode },
      ...dateFields,
    ];

    return (
      <section
        aria-label="Detalle de la solicitud"
        className="flex flex-col gap-4 rounded-lg border border-border bg-surface p-5"
      >
        <h2 className="text-xl font-bold text-ink">
          Detalle de la solicitud
        </h2>

        <p role="status" className="text-base font-semibold text-ink">
          {`Estado: ${statusLabel}`}
        </p>

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {fields.map((field) => (
            <div key={field.label} className="flex flex-col gap-1">
              <dt className="text-sm font-semibold text-text-secondary">
                {field.label}
              </dt>

              <dd className="text-base text-ink">
                {field.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
    );
  }

  return (
    <section
      aria-label="Detalle de la solicitud"
      className="flex w-full flex-col gap-5 rounded-lg border border-border bg-surface p-5 sm:p-6"
    >
      <div className="rounded-lg border border-danger/20 bg-brand-soft p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-danger/20 bg-surface text-danger"
          >
            <CircleX className="size-6" />
          </span>

          <div className="min-w-0 flex-1">
            <h2 className="font-tight text-xl font-bold text-ink sm:text-2xl">
              {statusLabel}
            </h2>

            <p role="status" className="sr-only">
              {`Estado: ${statusLabel}`}
            </p>

            <dl className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink">
              <div>
                <dt className="sr-only">
                  Código de solicitud
                </dt>

                <dd>{requestCode}</dd>
              </div>

              <div>
                <dt className="sr-only">
                  Nombre del solicitante
                </dt>

                <dd>
                  {fullName?.trim() || "Nombre no disponible"}
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-3 rounded-md bg-danger/5 px-4 py-3 sm:ml-13">
          <h3
            aria-label="Motivo del rechazo"
            className="text-base leading-snug font-bold text-danger"
          >
            Motivo: <span>{reasonTitle}</span>
          </h3>

          {reasonDescription ? (
            <p className="mt-1 text-base leading-snug whitespace-pre-wrap text-ink">
              {reasonDescription}
            </p>
          ) : null}

          {reviewedAt ? (
            <p className="mt-2 text-sm text-text-secondary italic">
              Revisado por la Secretaría,{" "}
              <span>{reviewDate ?? "Fecha no disponible"}</span>
            </p>
          ) : null}
        </div>
      </div>

      <aside
        aria-label="Antes de volver a subirlo"
        className="rounded-lg border border-border bg-surface p-4 sm:p-5"
      >
        <h2 className="font-tight text-lg font-bold text-ink">
          Antes de volver a subirlo
        </h2>

        <ul className="mt-3 flex flex-col gap-3">
          {DOCUMENT_RECOMMENDATIONS.map((tip) => (
            <li
              key={tip}
              className="flex items-start gap-2 text-sm text-ink"
            >
              <Check
                aria-hidden="true"
                className="mt-0.5 size-4 shrink-0"
              />

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

        {/* El canal de contacto queda pendiente de definición por el equipo. */}
        <Button
          type="button"
          variant="link"
          disabled
          className="h-auto px-3 py-2 text-base font-semibold text-ink"
        >
          Contactar a la carrera
        </Button>
      </div>
    </section>
  );
}