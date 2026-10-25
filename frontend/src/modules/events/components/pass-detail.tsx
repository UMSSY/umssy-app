'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatTimeRange } from '../utils/event-card';
import { formatEventLocation } from '../utils/format-event-location';
import { Card } from '@/components/ui/card';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { formatRegistrationDate } from '../utils/registration-format';
import { registrationsService, type PassData } from '../services/registrations.service';
import type { PassDetailProps } from '../types/pass-detail-props.types';
import { toast } from 'sonner';

export function PassDetail({ registration }: PassDetailProps) {
  const [passData, setPassData] = useState<PassData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const loadPass = async () => {
      try {
        const data = await registrationsService.getPass(
          registration.id,
          controller.signal,
        );
        if (isMounted) {
          setPassData(data);
        }
      } catch (err: unknown) {
        if (
          isMounted &&
          (err as Error).name !== 'CanceledError' &&
          (err as Error).name !== 'AbortError'
        ) {
          toast.error('No se pudo cargar la información del pase con QR.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadPass();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [registration.id]);

  const qrValue = passData?.qrToken
    ? `v1:${passData.qrToken}`
    : registration.id;

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
            {registration.eventName}
          </h2>
          <p className="text-sm text-surface/85">
            {formatRegistrationDate(registration.date)} ·{' '}
            {formatTimeRange(registration.startTime, registration.endTime)}
          </p>
        </div>

        <div className="flex items-center gap-2 text-sm text-surface/85">
          <MapPin className="size-4 shrink-0" />
          <span className="min-w-0 [overflow-wrap:anywhere] break-words">
            {formatEventLocation(registration.location)}
          </span>
        </div>

        <div className="mt-2 flex min-h-[220px] items-center justify-center rounded-xl bg-white p-6 shadow-inner">
          {loading ? (
            <div className="flex flex-col items-center gap-2 text-ink/70">
              <Loader2 className="size-8 animate-spin" />
              <span className="text-xs">Generando pase...</span>
            </div>
          ) : (
            <QRCodeSVG
              value={qrValue}
              size={180}
              level="M"
              includeMargin={false}
              className="h-auto max-w-[180px]"
            />
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
              <Check className="size-4" /> {registration.status || 'Confirmada'}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}