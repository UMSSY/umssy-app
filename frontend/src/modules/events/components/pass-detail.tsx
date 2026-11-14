'use client';

import { cn } from '@/lib/utils';

import { useEventScheduleStatus } from '../hooks/use-event-finished';
import { useQuery } from '@tanstack/react-query';
import { useRegistrationSession } from '@/modules/registrations';
import { Button } from '@/components/ui/button';
import { PassQr } from './pass-qr';
import { formatTimeRange } from '../utils/event-card';
import { formatEventLocation } from '../utils/format-event-location';
import { Card } from '@/components/ui/card';
import { Calendar, MapPin, Check, Clock, Loader2 } from 'lucide-react';
import { formatRegistrationDate, getEffectiveRegistrationStatus } from '../utils/registration-format';
import { registrationsService } from '../services/registrations.service';
import type { PassDetailProps } from '../types/pass-detail-props.types';

export function PassDetail({ registration, offlineQrToken }: PassDetailProps) {
  const accessToken = useRegistrationSession();
  const pass = useQuery({
    queryKey: ['private-event-pass', accessToken, registration.id],
    queryFn: ({ signal }) => registrationsService.getPass(registration.id, signal, accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });
  const detail = pass.data ?? registration;
  const savedQrToken = pass.data ? undefined : offlineQrToken;

  const eventStatus = useEventScheduleStatus({
    eventDate: detail.date,
    startTime: detail.startTime,
    endTime: detail.endTime,
  });
  const effectiveStatus = getEffectiveRegistrationStatus(
    detail.status,
    eventStatus.isFinished,
    eventStatus.isInProgress,
  );

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Card className="flex flex-col gap-6 rounded-lg border-0 bg-accent p-8 text-surface shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-gold uppercase">
            <div className="size-2 rounded-full bg-gold" />
            PASE UMSS · OFICIAL
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-1.5">
          <h2
            className="line-clamp-2 text-2xl leading-tight font-bold [overflow-wrap:anywhere] break-words"
            title={detail.eventName}
          >
            {detail.eventName}
          </h2>

          <div className="flex min-w-0 items-center gap-2 text-sm text-surface/85">
            <Calendar className="size-4 shrink-0 opacity-80" />
            <span className="min-w-0 [overflow-wrap:anywhere] break-words">
              {formatRegistrationDate(detail.date)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-surface/85">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span>{formatTimeRange(detail.startTime, detail.endTime)}</span>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 text-sm text-surface/85">
          <MapPin className="size-4 shrink-0" />
          <span
            className="line-clamp-1 min-w-0 [overflow-wrap:anywhere] break-words"
            title={formatEventLocation(detail.location)}
          >
            {formatEventLocation(detail.location)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex min-h-[220px] items-center justify-center rounded-xl bg-surface p-6 shadow-inner">
            {!accessToken ? (
              <p role="alert">Inicia sesión para consultar el pase.</p>
            ) : pass.isPending && !savedQrToken ? (
              <div className="flex flex-col items-center gap-2 text-ink/70">
                <Loader2 className="size-8 animate-spin" />
                <span className="text-xs">Generando pase...</span>
              </div>
            ) : effectiveStatus.isPast ? (
              <p className="text-center text-ink">Pase finalizado. Este taller ya concluyó.</p>
            ) : pass.isError && !savedQrToken ? (
              <div role="alert" className="space-y-3 text-center text-ink">
                <p>No se pudo cargar el pase. Inténtalo nuevamente.</p>
                <Button variant="outline" onClick={() => { void pass.refetch(); }}>Reintentar</Button>
              </div>
            ) : (
              <PassQr token={pass.data?.qrToken ?? savedQrToken ?? ''} />
            )}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4 border-t border-surface/10 pt-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] tracking-widest text-surface/80 uppercase">
              ID INSCRIPCIÓN
            </span>
            <span className="text-sm font-bold break-all">
              {registration.id}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] tracking-widest text-surface/80 uppercase">
              ESTADO
            </span>
            <span className={cn('flex items-center justify-end gap-1 text-sm font-bold',
              effectiveStatus.isPast ? 'text-surface/80' : 'text-gold'
            )}>
              {effectiveStatus.isPast ? <Clock className="size-4" /> : <Check className="size-4" />}
              {effectiveStatus.label}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
