'use client';

import { useEventTiming } from '../hooks/use-event-finished';
import { formatEventLocation } from '../utils/format-event-location';
import {
  formatRegistrationDate,
  formatRegistrationTimeRange,
  getEffectiveRegistrationStatus,
  isConfirmedRegistrationStatus,
} from '../utils/registration-format';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Check, Layers, MessageCircle, X } from 'lucide-react';
import { OfflineAvailableBadge } from './offline-available-badge';
import {
  formatSessionPosition,
  getNextSession,
  getSortedSessions,
  toSessionSchedule,
} from '../utils/event-sessions';

import type { PassCardProps } from '../types/pass-card-props.types';

export function PassCard({
  title,
  date,
  startTime,
  endTime,
  status,
  location,
  registrationId,
  isSelected,
  onClick,
  onOpenChat,
  chatDisabledReason,
  onCancelRegistration,
  cancelDisabledReason,
  isAvailableOffline,
  sessions,
}: PassCardProps) {
  const timing = useEventTiming({ date, startTime: startTime ?? '', endTime: endTime ?? '', sessions });
  const effectiveStatus = getEffectiveRegistrationStatus(status, timing.isPast, timing.isInProgress);
  // En talleres multisesión se muestra la sesión en curso o la próxima.
  const sortedSessions = getSortedSessions({ sessions });
  const nextSession = sortedSessions.length > 1
    ? getNextSession(sortedSessions) ?? sortedSessions[sortedSessions.length - 1]
    : null;
  const shown = nextSession ? toSessionSchedule(nextSession) : { date, startTime, endTime };
  const timeRange = (shown.startTime || shown.endTime) ? formatRegistrationTimeRange(shown.startTime ?? '', shown.endTime ?? '') : null;
  const canCancel =
    isConfirmedRegistrationStatus(status) &&
    timing.hasValidStart &&
    !timing.hasStarted;

  return (
    <Card className="relative gap-0 border-0 bg-transparent p-0 shadow-none">
      <Button
        variant="ghost"
        type="button"
        aria-pressed={Boolean(isSelected)}
        onClick={onClick}
        className={cn(
          "flex h-auto w-full min-w-0 flex-col items-stretch gap-4 rounded-lg p-5 pb-24 text-left whitespace-normal transition-all min-[360px]:pb-20",
          isSelected
            ? 'border border-accent bg-accent text-accent-foreground hover:bg-accent hover:text-accent-foreground'
            : 'border border-border bg-surface text-ink hover:border-border-strong'
        )}
      >
        <div
          className={cn("flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold",
            effectiveStatus.code === 'IN_PROGRESS'
              ? 'bg-success text-surface'
              : isSelected
              ? 'text-accent-foreground/85'
              : effectiveStatus.isPast
              ? 'bg-muted text-muted-foreground'
              : 'text-text-secondary'
          )}
        >
          <Check className="size-3" /> {effectiveStatus.label}
        </div>
        {isAvailableOffline ? <OfflineAvailableBadge /> : null}

        <div className="min-w-0">
          <h3
            className="mb-1 line-clamp-2 text-lg leading-tight font-bold [overflow-wrap:anywhere] break-words"
            title={title}
          >
            {title}
          </h3>
          <div
            className={cn("flex items-center gap-2 text-sm",
              isSelected ? 'text-accent-foreground/85' : 'text-text-secondary'
            )}
          >
            <Calendar className="size-4 shrink-0 opacity-70" />
            <span className="min-w-0 break-words">
              {formatRegistrationDate(shown.date)}
            </span>
          </div>
          {timeRange && <div className="mt-1 flex items-center gap-2 text-sm">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span>{timeRange}</span>
          </div>}
          {nextSession && <div className="mt-1 flex items-center gap-2 text-sm">
            <Layers className="size-4 shrink-0" aria-hidden="true" />
            <span>{formatSessionPosition(sortedSessions, nextSession)}</span>
          </div>}
          <p
            className="mt-2 line-clamp-1 text-sm [overflow-wrap:anywhere] break-words"
            title={formatEventLocation(location)}
          >
            {formatEventLocation(location)}
          </p>
        </div>
        <p className="min-w-0 text-xs">
          <span className="font-semibold">ID Inscripción: </span>
          <span className="break-all">{registrationId}</span>
        </p>
      </Button>

      <div className="absolute right-5 bottom-5 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant={isSelected ? "secondary" : "default"}
          size="default"
          type="button"
          aria-label="Abrir chat del taller"
          title={chatDisabledReason ?? (onOpenChat ? 'Abrir chat del taller' : 'Chat del taller próximamente')}
          disabled={!onOpenChat || Boolean(chatDisabledReason)}
          onClick={() => onOpenChat?.(registrationId)}
        >
          <MessageCircle className="size-5" aria-hidden="true" />
          <span>Chat</span>
        </Button>

        {canCancel ? (
          <Button
            variant="destructive"
            size="default"
            type="button"
            aria-label="Cancelar inscripción"
            title={cancelDisabledReason ?? 'Cancelar inscripción'}
            disabled={Boolean(cancelDisabledReason)}
            onClick={() => onCancelRegistration?.(registrationId)}
          >
            <X className="size-4" aria-hidden="true" />
            <span>Cancelar</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}