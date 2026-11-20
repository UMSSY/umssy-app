
import { Button } from "@/components/ui/button";
import type { MentorParticipationHistoryItem } from "../../types/mentor-participation-history.types";
import { getMentorRequestStatusLabel } from "../../utils/mentor-request-status";

type MentorRequestHistoryDetailsProps = {
  request: MentorParticipationHistoryItem;
  onClose: () => void;
};

const formatHistoryDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Fecha no disponible";
  }

  return new Intl.DateTimeFormat("es-BO", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  OFFERED: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
  ACTIVE:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  ENDED: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  CANCELLED: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
  EXPIRED: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

export function MentorRequestHistoryDetails({
  request,
  onClose,
}: MentorRequestHistoryDetailsProps) {
  return (
    <section
      aria-labelledby="mentor-request-history-details-title"
      className="space-y-6 rounded-lg border bg-background p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h3
            id="mentor-request-history-details-title"
            className="text-lg font-semibold"
          >
            Detalles de la solicitud
          </h3>

          <p className="text-sm text-muted-foreground">
            Información de tu solicitud de cupo como mentor.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          aria-label="Cerrar detalles de la solicitud"
        >
          Cerrar
        </Button>
      </div>

      <div className="space-y-2 rounded-lg bg-muted/40 p-4">
        <p className="text-sm font-medium text-muted-foreground">
          Estado de la solicitud
        </p>

        <span
          className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            statusStyles[request.status] ??
            "bg-muted text-muted-foreground"
          }`}
        >
          {getMentorRequestStatusLabel(request.status)}
        </span>
      </div>

      <div className="space-y-4">
        <h4 className="border-b pb-2 text-sm font-semibold">
          Fechas de la solicitud
        </h4>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">
              Fecha de creación
            </dt>
            <dd className="text-sm font-medium">
              {formatHistoryDate(request.createdAt)}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">
              Ingreso a la cola
            </dt>
            <dd className="text-sm font-medium">
              {formatHistoryDate(request.queuedAt)}
            </dd>
          </div>

          <div className="space-y-1">
            <dt className="text-sm text-muted-foreground">
              Última actualización
            </dt>
            <dd className="text-sm font-medium">
              {formatHistoryDate(request.updatedAt)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-4">
        <h4 className="border-b pb-2 text-sm font-semibold">
          Preferencias seleccionadas
        </h4>

        <dl className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">
              Áreas técnicas
            </dt>
            <dd className="mt-2 text-2xl font-semibold">
              {request.technicalAreaIds.length}
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Áreas seleccionadas en la solicitud
            </p>
          </div>

          <div className="rounded-lg border p-4">
            <dt className="text-sm text-muted-foreground">
              Tipos de orientación
            </dt>
            <dd className="mt-2 text-2xl font-semibold">
              {request.orientationTypeIds.length}
            </dd>
            <p className="mt-1 text-xs text-muted-foreground">
              Orientaciones seleccionadas
            </p>
          </div>
        </dl>
      </div>

      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-semibold">
          Identificador de la solicitud
        </h4>

        <p className="rounded-md bg-muted/40 p-3 font-mono text-xs break-all text-muted-foreground">
          {request.id}
        </p>
      </div>
    </section>
  );
}
