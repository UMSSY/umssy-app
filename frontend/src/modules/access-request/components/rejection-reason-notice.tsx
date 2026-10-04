import type { RejectionReasonNoticeProps } from "../types/rejection-reason-types";

const MISSING_REASON_MESSAGE = "El revisor no registró un motivo para este rechazo.";

export function RejectionReasonNotice({
  status,
  rejectionReason,
}: RejectionReasonNoticeProps) {
  // El motivo solo se muestra cuando la solicitud fue rechazada
  if (status !== "REJECTED") {
    return null;
  }

  const reason = rejectionReason?.trim();

  return (
    <section
      aria-labelledby="rejection-reason-title"
      className="rounded-lg border border-border bg-surface p-4 shadow-sm"
    >
      <h2 id="rejection-reason-title" className="text-base font-bold text-danger">
        Solicitud rechazada
      </h2>
      <p className="mt-3 text-xs font-semibold uppercase text-text-secondary">
        Motivo del rechazo
      </p>
      <p
        data-testid="rejection-reason"
        className="mt-1 text-sm whitespace-pre-line wrap-break-word text-ink"
      >
        {reason || MISSING_REASON_MESSAGE}
      </p>
    </section>
  );
}
