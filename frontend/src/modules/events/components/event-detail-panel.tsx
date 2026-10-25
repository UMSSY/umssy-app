"use client";
import { formatEventLocation } from '../utils/format-event-location';


import { useEffect, useRef } from "react";
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
import { WorkshopCover } from './workshop-cover';
import { EventRegistrationAction } from './event-registration-action';

import type { EventDetailPanelProps } from '../types/event-detail-panel-props.types';

export function EventDetailPanel({ event, onClose }: EventDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, [event.id]);
  const hasValidCapacity = hasValidEventCapacity(event);
  const { enrolledCount, capacity, progressPercentage, isFull } =
    calculateEventCapacityStatus(event);
  const availableSpots = event.availableSpots;

  return (
    <aside
      aria-label={`Detalle de ${event.title}`}
      className="w-full min-w-0 self-start rounded-lg border border-border bg-surface "
    >
      <WorkshopCover eventId={event.id} coverUrl={event.coverUrl} className="h-32 rounded-t-lg" />
      <Card className="gap-0 space-y-5 rounded-none border-0 bg-transparent px-6 py-7 shadow-none lg:px-7">
        <header className="space-y-3">
          {onClose && (
            <div className="flex justify-end">
              <Button variant="ghost" size="icon" aria-label="Cerrar detalle del taller" onClick={onClose}>
                <X aria-hidden="true" />
              </Button>
            </div>
          )}
          <span className="inline-flex w-fit rounded-md bg-interaction px-3 py-1 text-xs font-semibold text-accent">
            {event.category.name}
          </span>
          <h2 ref={titleRef} tabIndex={-1} className="text-lg leading-6 font-bold break-words text-ink">
            {event.title}
          </h2>
        </header>

        {event.status === 'voting' && <div className="space-y-1 rounded-lg border border-availability-border bg-availability p-3 text-sm"><p className="font-semibold text-availability-foreground">Propuesta en votación</p><p>Necesita {event.supportThreshold} apoyos.</p>{event.votingDeadline && <p className="text-xs text-text-secondary">Plazo: {new Date(event.votingDeadline).toLocaleString('es-BO')}</p>}</div>}

        <EventRegistrationAction key={event.id} event={event} onEventNotFound={onClose} />

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
                className="h-full rounded-full bg-progress transition-[width] duration-300 ease-out"
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


      </Card>
    </aside>
  );
}
