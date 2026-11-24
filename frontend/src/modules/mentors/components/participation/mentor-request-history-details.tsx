import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MentorParticipationHistoryItem } from '../../types/mentor-participation-history.types';
import { MentorRequestStatusBadge } from './mentor-request-status-badge';

type MentorRequestHistoryDetailsProps = {
  request: MentorParticipationHistoryItem;
  technicalAreaNames: string[];
  orientationNames: string[];
  onClose: () => void;
};

const formatHistoryDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(date);
};

const formatHistoryTitleDate = (value: string): string => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

export function MentorRequestHistoryDetails({
  request,
  technicalAreaNames,
  orientationNames,
  onClose,
}: MentorRequestHistoryDetailsProps) {
  const isAccepted = request.status === 'ACTIVE';

  return (
    <section
      aria-labelledby="mentor-request-history-details-title"
      className="space-y-5 rounded-lg border bg-background p-5 shadow-sm"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3
            id="mentor-request-history-details-title"
            className="text-lg font-semibold"
          >
            Detalle de la solicitud — {formatHistoryTitleDate(request.createdAt)}
          </h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Información registrada en tu solicitud de cupo como mentor.
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

      <div className="grid gap-5 border-t pt-5 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-sm font-medium">Áreas técnicas:</p>

          <div className="flex flex-wrap gap-2">
            {technicalAreaNames.map((name, index) => (
              <span
                key={`${request.id}-detail-area-${index}`}
                className="rounded-md bg-muted px-2.5 py-1.5 text-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Tipos de orientación:</p>

          <div className="flex flex-wrap gap-2">
            {orientationNames.map((name, index) => (
              <span
                key={`${request.id}-detail-orientation-${index}`}
                className="rounded-md bg-muted px-2.5 py-1.5 text-sm"
              >
                {name}
              </span>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Fecha de registro:</p>

          <p className="text-sm text-muted-foreground">
            {formatHistoryDate(request.createdAt)}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Estado actual:</p>

          <MentorRequestStatusBadge status={request.status} />
        </div>
      </div>

      {isAccepted && (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-sky-200 bg-sky-50 p-4 text-sm text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200"
        >
          <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />

          <p>
            Tu solicitud fue aceptada. Ya puedes acceder a las mentorías
            disponibles.
          </p>
        </div>
      )}
    </section>
  );
}
