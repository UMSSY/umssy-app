
import { ClipboardList } from "lucide-react";

export function MentorRequestHistoryEmptyState() {
  return (
    <section
      role="status"
      aria-labelledby="mentor-request-history-empty-title"
      className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 px-6 py-12 text-center"
    >
      <div className="flex size-14 items-center justify-center rounded-full bg-muted">
        <ClipboardList
          aria-hidden="true"
          className="size-7 text-muted-foreground"
        />
      </div>

      <div className="max-w-md space-y-2">
        <h3
          id="mentor-request-history-empty-title"
          className="text-lg font-semibold"
        >
          Aún no tienes solicitudes registradas
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          Cuando realices una solicitud de cupo como mentor, podrás
          consultar aquí su estado, fechas y detalles.
        </p>
      </div>
    </section>
  );
}
