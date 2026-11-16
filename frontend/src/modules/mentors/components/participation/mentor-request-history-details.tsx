
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

export function MentorRequestHistoryDetails({
  request,
  onClose,
}: MentorRequestHistoryDetailsProps) {
  return (
    <section
      aria-labelledby="mentor-request-history-details-title"
      className="space-y-5 rounded-lg border bg-background p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h3
            id="mentor-request-history-details-title"
            className="text-lg font-semibold"
          >
            Detalles de la solicitud
          </h3>

          <p className="text-sm text-muted-foreground">
            Información registrada en el historial de participación.
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

      <dl className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Estado de la solicitud
          </dt>
          <dd className="text-sm font-semibold">
            {getMentorRequestStatusLabel(request.status)}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Fecha de creación
          </dt>
          <dd className="text-sm">
            {formatHistoryDate(request.createdAt)}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Fecha de ingreso a la cola
          </dt>
          <dd className="text-sm">
            {formatHistoryDate(request.queuedAt)}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Última actualización
          </dt>
          <dd className="text-sm">
            {formatHistoryDate(request.updatedAt)}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Áreas técnicas seleccionadas
          </dt>
          <dd className="text-sm">
            {request.technicalAreaIds.length}
          </dd>
        </div>

        <div className="space-y-1">
          <dt className="text-sm font-medium text-muted-foreground">
            Tipos de orientación seleccionados
          </dt>
          <dd className="text-sm">
            {request.orientationTypeIds.length}
          </dd>
        </div>
      </dl>

      <div className="space-y-2 border-t pt-4">
        <h4 className="text-sm font-semibold">
          Identificador de la solicitud
        </h4>

        <p className="font-mono text-xs break-all text-muted-foreground">
          {request.id}
        </p>
      </div>
    </section>
  );
}
