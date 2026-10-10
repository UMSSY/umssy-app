import type { ReviewProfileStatus } from "../types/review-queue.types";

interface ReviewStatusBadgeProps {
  status: ReviewProfileStatus;
}

const STATUS_DOT_CLASS: Record<ReviewProfileStatus, string> = {
  Completado: "bg-ink-soft",
  Procesando: "bg-ink-soft",
  Pendiente: "bg-accent",
};

export function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft whitespace-nowrap">
      <span
        className={`size-1.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[status]}`}
        aria-hidden="true"
      />
      {status}
    </span>
  );
}
