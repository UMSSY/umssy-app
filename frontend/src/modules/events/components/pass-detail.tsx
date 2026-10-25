'use client';

import { useEffect, useState } from 'react';
import { formatTimeRange } from '../utils/event-card';
import { formatEventLocation } from '../utils/format-event-location';
import { Card } from '@/components/ui/card';
import { MapPin, Check, Loader2 } from 'lucide-react';
import { formatRegistrationDate } from '../utils/registration-format';
import { registrationsService, type PassData } from '../services/registrations.service';
import type { PassDetailProps } from '../types/pass-detail-props.types';
import { toast } from 'sonner';

// Generador de Código QR en TypeScript puro (sin dependencias de node_modules)
function generateQrMatrix(text: string): boolean[][] {
  const size = 25;
  const matrix: (boolean | null)[][] = Array.from({ length: size }, () =>
    Array(size).fill(null)
  );

  const addFinder = (sr: number, sc: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          matrix[sr + r][sc + c] = true;
        } else {
          matrix[sr + r][sc + c] = false;
        }
      }
    }
  };

  addFinder(0, 0);
  addFinder(0, size - 7);
  addFinder(size - 7, 0);

  for (let c = 8; c < size - 8; c++) {
    if (matrix[6][c] === null) matrix[6][c] = c % 2 === 0;
    if (matrix[c][6] === null) matrix[c][6] = c % 2 === 0;
  }

  const bytes = new TextEncoder().encode(text);
  let bitIndex = 0;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (matrix[r][c] === null) {
        const bytePos = Math.floor(bitIndex / 8);
        const bitPos = 7 - (bitIndex % 8);
        const bitVal =
          bytePos < bytes.length ? (bytes[bytePos] >> bitPos) & 1 : 0;
        const mask = (r + c) % 2 === 0;
        matrix[r][c] = (bitVal === 1) !== mask;
        bitIndex++;
      }
    }
  }

  return matrix.map((row) => row.map((cell) => cell ?? false));
}

interface QRCodeProps {
  value: string;
  size?: number;
  title?: string;
  'aria-label'?: string;
  className?: string;
}

function QRCodeSVG({
  value,
  size = 180,
  title = 'Vista ilustrativa de QR',
  'aria-label': ariaLabel = 'Vista ilustrativa de QR',
  className = '',
}: QRCodeProps) {
  const matrix = generateQrMatrix(value);
  const matrixSize = matrix.length;
  const cellSize = size / matrixSize;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={ariaLabel}
      className={className}
    >
      <title>{title}</title>
      <rect width={size} height={size} fill="#ffffff" />
      {matrix.map((row, r) =>
        row.map((cell, c) =>
          cell ? (
            <rect
              key={`${r}-${c}`}
              x={c * cellSize}
              y={r * cellSize}
              width={cellSize + 0.3}
              height={cellSize + 0.3}
              fill="#000000"
            />
          ) : null
        )
      )}
    </svg>
  );
}

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
              title="Vista ilustrativa de QR"
              aria-label="Vista ilustrativa de QR"
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