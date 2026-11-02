'use client';

import { useQuery } from '@tanstack/react-query';
import { useRegistrationSession } from '@/modules/registrations';
import { Button } from '@/components/ui/button';
import { PassQr } from './pass-qr';
import { formatTimeRange } from '../utils/event-card';
import { formatEventLocation } from '../utils/format-event-location';
import { Card } from '@/components/ui/card';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { formatRegistrationDate } from '../utils/registration-format';
import { registrationsService } from '../services/registrations.service';
import type { PassDetailProps } from '../types/pass-detail-props.types';

export function PassDetail({ registration }: PassDetailProps) {
  const accessToken = useRegistrationSession();
  const pass = useQuery({
    queryKey: ['private-event-pass', accessToken, registration.id],
    queryFn: ({ signal }) => registrationsService.getPass(registration.id, signal, accessToken),
    enabled: Boolean(accessToken),
    retry: false,
  });
  const detail = pass.data ?? registration;

  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Card className="flex flex-col gap-6 rounded-lg border-0 bg-accent p-8 text-surface shadow-none">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-amber-400 uppercase">
            <div className="size-2 rounded-full bg-amber-400" />
            PASE UMSS · OFICIAL
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl leading-tight font-bold [overflow-wrap:anywhere] break-words">
            {detail.eventName}
          </h2>
          <p className="text-sm text-surface/85">
            {formatRegistrationDate(detail.date)} ·{' '}
            {formatTimeRange(detail.startTime, detail.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-surface/85">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere] break-words">
            {formatEventLocation(detail.location)}
          </span>
        </div>

        <div className="mt-2 flex min-h-[220px] items-center justify-center rounded-xl bg-white p-6 shadow-inner">
          {!accessToken ? <p role="alert">Inicia sesión para consultar el pase.</p> : pass.isPending ? (
            <div className="flex flex-col items-center gap-2 text-ink/70">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-xs">Generando pase...</span>
            </div>
          ) : pass.isError ? (
            <div role="alert" className="space-y-3 text-center text-ink">
              <p>No se pudo cargar el pase. Inténtalo nuevamente.</p>
              <Button variant="outline" onClick={() => { void pass.refetch(); }}>Reintentar</Button>
            </div>
          ) : (
            <PassQr token={pass.data.qrToken} />
          )}
        </div>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4 border-t border-white/10 pt-5">
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
            <span className="flex items-center justify-end gap-1 text-sm font-bold text-emerald-400">
              <Check className="size-4" /> {detail.status}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}