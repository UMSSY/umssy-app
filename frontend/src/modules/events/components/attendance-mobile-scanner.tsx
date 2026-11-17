'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AttendanceQrCamera } from './attendance-qr-camera';
import { AttendanceResultPanel } from './attendance-result-panel';
import { useAttendanceCheckIn } from '../hooks/use-attendance-check-in';
import type { AttendanceMobileScannerProps } from '../types/attendance-mobile-scanner-props.types';

export function AttendanceMobileScanner({ workshopId }: AttendanceMobileScannerProps) {
  const [reference, setReference] = useState('');
  const { panel, capture, dismiss: dismissCheckIn } = useAttendanceCheckIn(workshopId);

  function dismiss() {
    dismissCheckIn();
    setReference('');
  }

  function submit(value: string) {
    setReference('');
    return capture(value);
  }

  return (
    <div className="space-y-5">
      <AttendanceQrCamera paused={Boolean(panel)} onDetected={submit} />
      <form
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          submit(reference);
        }}
      >
        <Label
          htmlFor="manual-attendance-reference"
          className="block text-sm font-semibold text-ink"
        >
          Ingresar referencia manualmente
        </Label>
        <p className="text-sm text-text-secondary">
          Si la cámara no lee el pase, escribe el token del pase o el ID de
          inscripción.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            id="manual-attendance-reference"
            value={reference}
            onChange={(event) => setReference(event.target.value.slice(0, 70))}
            maxLength={70}
            autoComplete="off"
            spellCheck={false}
            placeholder="Referencia o ID de inscripción"
            className="min-w-0 flex-1"
          />
          <Button type="submit" disabled={Boolean(panel)}>
            Validar
          </Button>
        </div>
      </form>
      {panel && (
        <AttendanceResultPanel state={panel} onDismiss={dismiss} />
      )}
    </div>
  );
}
