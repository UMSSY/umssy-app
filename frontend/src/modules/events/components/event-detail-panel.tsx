import { Card } from '@/components/ui/card';
import { CalendarDays, Clock3, MapPin, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  calculateEventCapacityStatus,
  formatEventDate,
  formatTimeRange,
} from '../utils/event-card';
import { DetailRow } from './detail-row';
import { hasValidEventCapacity } from '../utils/has-valid-event-capacity';
import { formatEventLocation } from '../utils/format-event-location';

import type { EventDetailPanelProps } from '../types/event-detail-panel-props.types';

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const hasValidCapacity = hasValidEventCapacity(event);
  const { enrolledCount, capacity, progressPercentage, isFull } =
    calculateEventCapacityStatus(event);
  const availableSpots = event.availableSpots;

  return (
    <aside
      aria-label={`Detalle de ${event.title}`}
      className="max-h-[55dvh] min-h-0 w-full shrink-0 overflow-y-auto overscroll-contain border-t border-border bg-surface lg:h-full lg:max-h-none lg:w-[340px] lg:border-t-0 lg:border-l xl:w-[360px]"
    >
      <Card className="gap-0 space-y-5 rounded-none border-0 bg-transparent px-6 py-7 shadow-none lg:px-7">
        <header className="space-y-3">
          {onClose && (
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" aria-label="Cerrar detalle del taller" onClick={onClose}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}
          <span className="inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-text-secondary">
            {event.category.name}
          </span>
          <h2 className="text-lg leading-6 font-bold break-words text-ink">
            {event.title}
          </h2>
        </header>

        <p className="text-sm text-text-secondary">
          Modalidad: {event.modality.title}
        </p>
        <dl className="space-y-2 border-b border-border pb-4">
          <DetailRow
            icon={CalendarDays}
            label="Fecha"
            value={formatEventDate(event.eventDate)}
          />
          <DetailRow
            icon={Clock3}
            label="Horario"
            value={formatTimeRange(event.startTime, event.endTime)}
          />
          <DetailRow
            icon={MapPin}
            label={
              event.modality.title.toLowerCase() === 'virtual'
                ? 'Enlace'
                : 'Lugar'
            }
            value={formatEventLocation(event.location)}
          />
          <DetailRow
            icon={UserRound}
            label="Instructor"
            value={event.instructorName?.trim() || 'Por confirmar'}
          />
        </dl>

        <section
          aria-labelledby="event-description-title"
          className="space-y-2"
        >
          <h3
            className="text-xs font-semibold tracking-wide text-text-secondary uppercase"
            id="event-description-title"
          >
            Descripción
          </h3>
          <p className="text-sm leading-5 break-words whitespace-pre-line text-text-secondary">
            {event.description?.trim() || 'Descripción por confirmar.'}
          </p>
        </section>

        <section aria-labelledby="event-capacity-title" className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3
              className="text-xs font-semibold tracking-wide text-text-secondary uppercase"
              id="event-capacity-title"
            >
              Cupos
            </h3>
            <span className="text-xs font-semibold text-ink">
              {!hasValidCapacity
                ? 'Por confirmar'
                : capacity === null
                  ? `${enrolledCount} inscritos`
                  : `${enrolledCount} de ${capacity}`}
            </span>
          </div>
          {hasValidCapacity && progressPercentage !== null && (
            <div
              aria-label={`Ocupación del taller: ${progressPercentage}%`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={progressPercentage}
              className="h-1.5 overflow-hidden rounded-full bg-muted"
              role="progressbar"
            >
              <div
                className={`h-full rounded-full transition-[width] ${isFull ? 'bg-accent' : 'bg-gold'}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          )}
          <p
            id="event-capacity-description"
            aria-live="polite"
            className="text-xs text-text-secondary"
          >
            {!hasValidCapacity
              ? 'Información de cupos no disponible.'
              : capacity === null
                ? 'Sin límite de cupos'
                : isFull
                  ? 'Lleno · Sin cupos disponibles'
                  : `${availableSpots} cupos disponibles`}
          </p>
        </section>

        <Button
          aria-describedby="event-capacity-description"
          className="mt-2 min-h-11 w-full bg-accent text-white hover:bg-danger disabled:bg-muted disabled:text-text-secondary disabled:opacity-100"
          disabled={!hasValidCapacity || isFull}
          size="lg"
          type="button"
        >
          Inscribirme
        </Button>
      </Card>
    </aside>
  );
}
