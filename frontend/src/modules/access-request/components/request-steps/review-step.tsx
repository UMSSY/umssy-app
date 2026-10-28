"use client";

import { useEffect } from "react";
import { Check, Hourglass } from "lucide-react";
import { cn } from "cn";
import { PageHeading } from "@/shared/components/layout/page-heading";
import { useAccessRequestForm } from "../../contexts/access-request-context";
import { formatSubmissionDate } from "../../utils/format-submission-date";
import type { StageState, Stage } from "../../types/review-step.types";

const STATE_TEXT: Record<StageState, string> = {
  done: "Completada",
  current: "En curso",
  pending: "Pendiente",
};

export function ReviewStep() {
  const { values, submission, refreshSubmission } = useAccessRequestForm();

  // Una consulta al montar: la pantalla ya tiene el estado del envío y un fallo no la rompe
  useEffect(() => {
    void refreshSubmission();
  }, [refreshSubmission]);

  if (!submission) return null;

  const isReviewing = submission.status === "pending" || submission.status === "in_review";
  const isApproved = submission.status === "approved";
  const isRejected = submission.status === "rejected";
  const statusLabel = isApproved ? "Aprobada" : isRejected ? "Rechazada" : "En revisión";
  const sentAt = formatSubmissionDate(submission.submittedAt) ?? "Fecha no disponible";
  const reviewedAt = formatSubmissionDate(submission.reviewedAt);

  const stages: Stage[] = [
    { label: "Solicitud enviada", detail: sentAt, state: "done" },
    { label: "Documento recibido", detail: sentAt, state: "done" },
    {
      label: "En revisión",
      detail: isReviewing ? "En curso" : (reviewedAt ?? "Revisión terminada"),
      state: isReviewing ? "current" : "done",
    },
    {
      label: "Activación de tu cuenta",
      detail: isApproved ? "En curso" : isRejected ? "No disponible" : "Pendiente",
      state: isApproved ? "current" : "pending",
    },
  ];

  return (
    <div className="flex w-full flex-col gap-5">
      {/* TODO: indicar qué hacer tras un rechazo cuando se defina el reenvío (el issue #495 no lo define) */}
      <PageHeading
        title="Revisión de la carrera"
        description={
          isRejected
            ? "Tu solicitud fue rechazada."
            : `Estamos revisando tu solicitud. Te avisaremos a ${values.email.trim()} cuando tengamos novedades.`
        }
      />

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-surface p-5">
        <p className="text-xs font-semibold text-text-secondary">Tu código de solicitud</p>
        <p className="text-3xl font-extrabold tracking-wide text-ink">{submission.requestCode}</p>
        <p className="text-xs text-text-secondary">
          Guárdalo: lo necesitarás para consultar el estado de tu solicitud.
        </p>
        <p className={cn("text-sm font-semibold", isRejected ? "text-danger" : "text-ink")}>
          {`Estado: ${statusLabel}`}
        </p>
        {isRejected && submission.rejectionReason ? (
          <p role="status" className="text-sm text-danger">
            {`Motivo del rechazo: ${submission.rejectionReason}`}
          </p>
        ) : null}
      </div>

      <ol aria-label="Línea de tiempo de la solicitud" className="flex flex-col rounded-lg border border-border bg-surface p-5">
        {stages.map((stage, index) => (
          <li
            key={stage.label}
            aria-current={stage.state === "current" ? "step" : undefined}
            className={cn("flex gap-3.5", stage.state === "pending" && "opacity-60")}
          >
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border",
                  stage.state === "done" && "border-ink bg-ink text-surface",
                  stage.state === "current" && "border-accent bg-surface text-accent",
                  stage.state === "pending" && "border-border-strong bg-surface text-text-secondary",
                )}
              >
                {stage.state === "done" ? <Check aria-hidden="true" className="size-4" /> : null}
                {stage.state === "current" ? <Hourglass aria-hidden="true" className="size-3.5" /> : null}
              </span>
              {index < stages.length - 1 ? <span aria-hidden="true" className="my-1 h-5 w-[1.5px] bg-border-strong" /> : null}
            </div>
            <div className="pb-2">
              <p className={cn("text-sm font-semibold", stage.state === "current" ? "text-ink" : "text-ink-soft")}>
                {stage.label}
                <span className="sr-only">{`: ${STATE_TEXT[stage.state]}`}</span>
              </p>
              <p className="text-xs text-text-secondary">{stage.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
