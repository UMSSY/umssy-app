import { Card } from '@/components/ui/card';
import { MapPin, QrCode, Check } from 'lucide-react';

import {
  formatRegistrationDate,
  formatRegistrationTime,
} from '../utils/registration-format';
import type { PassDetailProps } from '../types/pass-detail-props.types';

export function PassDetail({ registration }: PassDetailProps) {
  return (
    <div className="flex w-full min-w-0 flex-col gap-5">
      <Card className="flex flex-col gap-6 rounded-lg border-0 bg-accent p-8 text-surface shadow-none">
        <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-surface/85 uppercase">
          <div className="size-1.5 rounded-full bg-ink-soft"></div>
          Inscripción al taller
        </div>

        <div className="flex flex-col gap-1.5">
          <h2 className="text-2xl leading-tight font-bold [overflow-wrap:anywhere] break-words">
            {registration.eventName}
          </h2>
          <p className="text-sm text-surface/85">
            {formatRegistrationDate(registration.date)} ·{' '}
            {formatRegistrationTime(registration.startTime)} -{' '}
            {formatRegistrationTime(registration.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-surface/85">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere] break-words">
            {registration.location}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-center rounded-lg bg-surface p-6">
          <QrCode
            aria-label="Vista ilustrativa de QR"
            className="h-auto w-full max-w-[220px] text-ink opacity-90"
            strokeWidth={1}
          />
        </div>

        <p className="text-xs text-surface/85">
          El QR de esta vista es ilustrativo; aún no está habilitado para
          validar asistencia.
        </p>

        <div className="mt-2 flex flex-wrap items-start justify-between gap-4 border-t border-white/10 pt-5">
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[10px] tracking-widest text-surface/80 uppercase">
              ID Inscripción
            </span>
            <span className="text-sm font-bold break-all">
              {registration.id}
            </span>
          </div>
          <div className="flex flex-col gap-1 text-right">
            <span className="text-[10px] tracking-widest text-surface/80 uppercase">
              Estado
            </span>
            <span className="flex items-center justify-end gap-1 text-sm font-bold text-surface/85">
              <Check className="size-4" /> {registration.status}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}
