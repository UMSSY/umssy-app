"use client";

import { useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { CalendarDays, Check, Clock3, MapPin, UserRound, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  calculateEventCapacityStatus,
  formatEventDate,
  formatTimeRange,
} from '../utils/event-card';
import { formatVotingDeadline, getEventDisplayStatus } from '../utils/event-display-status';
import { formatEventLocation } from '../utils/format-event-location';
import { DetailRow } from './detail-row';
import { hasValidEventCapacity } from '../utils/has-valid-event-capacity';
import { WorkshopCover } from './workshop-cover';
import { EventRegistrationAction } from './event-registration-action';
import { ProposalProgress } from './proposal-progress';
import { RequestFeedback } from './request-feedback';
import { PROPOSAL_SUPPORT_ERROR_MESSAGES } from '../constants/proposal-support-errors.constants';

import type { EventDetailPanelProps } from '../types/event-detail-panel-props.types';

export function EventDetailPanel({
  event,
  onClose,
  onSupport,
  isSupportPending = false,
  isSupportDisabled = false,
  supportNotice,
  supportError,
  supportSuccessMessage,
  onRetrySupport,
}: EventDetailPanelProps) {
  const titleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { titleRef.current?.focus(); }, [event.id]);
  const displayStatus = getEventDisplayStatus(event);
  const isProposal = displayStatus === 'voting' || displayStatus === 'expired';
  const votingDeadline = formatVotingDeadline(event.votingDeadline);
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex w-fit rounded-md bg-interaction px-3 py-1 text-xs font-semibold text-accent">
              {event.category.name}
            </span>
            {displayStatus === 'voting' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700"><Clock3 className="size-3.5" aria-hidden="true" />En votación</span>
            )}
            {displayStatus === 'expired' && (
              <span className="rounded-full bg-surface-soft px-3 py-1 text-xs font-semibold text-text-secondary">Vencido</span>
            )}
            {displayStatus === 'full' && (
              <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-danger">Lleno</span>
            )}
            {displayStatus === 'published' && event.status === 'Publicado' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" aria-hidden="true" />Publicada</span>
            )}
          </div>
          <h2 ref={titleRef} tabIndex={-1} className="text-lg leading-6 font-bold break-words text-ink">
            {event.title}
          </h2>
        </header>

        {!isProposal && (
          <EventRegistrationAction key={event.id} event={event} onEventNotFound={onClose} />
        )}

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

        {isProposal && (
          <section aria-label="Estado de la propuesta" className="space-y-3 rounded-lg border border-border bg-surface-soft p-4">
            <p className="text-sm font-semibold text-ink">
              {displayStatus === 'expired' ? 'Propuesta con plazo vencido' : 'Propuesta en votación'}
            </p>
            {votingDeadline && (
              <p className="text-xs text-text-secondary">
                {displayStatus === 'expired' ? 'Plazo cerrado:' : 'Fecha límite:'} {votingDeadline}
              </p>
            )}
            <ProposalProgress event={event} isExpired={displayStatus === 'expired'} />
            {displayStatus === 'voting' && event.hasSupported && (
              <p role="status" className="rounded-md bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800">
                <Check className="mr-1 inline size-3.5" aria-hidden="true" />
                {PROPOSAL_SUPPORT_ERROR_MESSAGES.ALREADY_SUPPORTED}
              </p>
            )}
          </section>
        )}

        {isProposal && (
          <Button
            type="button"
            size="lg"
            className="min-h-11 w-full bg-orange-500 text-white hover:bg-orange-600 disabled:bg-muted disabled:text-text-secondary disabled:opacity-100"
            disabled={displayStatus === 'expired' || !onSupport || isSupportPending || isSupportDisabled || event.hasSupported}
            onClick={() => onSupport?.(event)}
          >
            {displayStatus === 'expired'
              ? 'Preinscribirme/Apoyar propuesta'
              : isSupportPending
                ? 'Registrando apoyo...'
                : event.hasSupported
                  ? 'Ya apoyaste esta propuesta'
                  : 'Preinscribirme/Apoyar propuesta'}
          </Button>
        )}
        {displayStatus === 'voting' && supportNotice && (
          <RequestFeedback message={supportNotice} />
        )}
        {supportError && <RequestFeedback message={supportError} isError onRetry={onRetrySupport} retryLabel="Reintentar apoyo" />}
        {supportSuccessMessage && <RequestFeedback message={supportSuccessMessage} />}

        {!isProposal && <section aria-labelledby="event-capacity-title" className="space-y-2">
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
        </section>}
      </Card>
    </aside>
  );
}
