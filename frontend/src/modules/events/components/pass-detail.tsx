import { Card } from '@/components/ui/card';
import { MapPin, QrCode, Check } from 'lucide-react';

import { formatRegistrationDate } from '../utils/registration-format';
import { formatTimeRange } from '../utils/event-card';
import { formatEventLocation } from '../utils/format-event-location';
import type { PassDetailProps } from '../types/pass-detail-props.types';

export function PassDetail({ registration }: PassDetailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Card className="flex flex-col gap-6 rounded-[24px] border-0 bg-ink p-8 text-surface shadow-sm">
        <div className="flex items-center gap-2 text-[11px] font-bold tracking-widest text-gold uppercase">
          <div className="size-1.5 rounded-full bg-gold"></div>
          Pase UMSS - Oficial
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-[22px] leading-tight font-bold [overflow-wrap:anywhere] break-words">
            {registration.eventName}
          </h2>
          <p className="text-sm text-surface-soft/70">
            {formatRegistrationDate(registration.date)} ·{' '}
            {formatTimeRange(registration.startTime, registration.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-surface-soft/70">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere] break-words">
            {formatEventLocation(registration.location)}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-center rounded-3xl bg-surface p-6">
          <QrCode
            aria-label="Vista ilustrativa de QR"
            className="h-auto w-full max-w-[220px] text-ink opacity-90"
            strokeWidth={1}
          />
        </div>

        <p className="text-xs text-surface-soft/70">
          El QR de esta vista es ilustrativo; aún no está habilitado para
          validar asistencia.
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4 border-t border-white/10 pt-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] tracking-widest text-surface-soft/50 uppercase">
              ID Inscripción
            </span>
            <span className="text-sm font-bold break-all">
              {registration.id}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] tracking-widest text-surface-soft/50 uppercase">
              Estado
            </span>
            <span className="flex items-center justify-end gap-1 text-sm font-bold text-gold">
              <Check className="size-4" /> {registration.status}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
