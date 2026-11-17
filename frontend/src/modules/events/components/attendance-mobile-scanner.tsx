'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttendanceQrCamera } from './attendance-qr-camera';
import { parseAttendanceReference } from '../utils/attendance-reference';
import { AttendanceResultPanel } from './attendance-result-panel';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';
import { attendanceCheckInService } from '../services/attendance-check-in.service';
import { getAttendanceCheckInError } from '../utils/attendance-check-in-error';

export function AttendanceMobileScanner({
  workshopId,
}: {
  workshopId: string;
}) {
  const [reference, setReference] = useState('');
  const [panel, setPanel] = useState<AttendancePanelState | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const pendingRef = useRef(false);
  useEffect(
    () => () => {
      requestRef.current?.abort();
    },
    [],
  );

  function dismiss() {
    setPanel(null);
    setReference('');
  }

  function capture(value: string) {
    if (pendingRef.current || panel) return true;
    const parsed = parseAttendanceReference(value);
    setReference('');
    if (!parsed) {
      setPanel({
        kind: 'invalid',
        message:
          'Formato de pase no reconocido. Ingresa una referencia válida o vuelve a escanear.',
      });
      return true;
    }
    pendingRef.current = true;
    setPanel({ kind: 'verifying' });
    const controller = new AbortController();
    requestRef.current = controller;
    void attendanceCheckInService
      .checkIn(workshopId, parsed, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setPanel({ kind: result });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setPanel(getAttendanceCheckInError(error));
      })
      .finally(() => {
        if (requestRef.current === controller) requestRef.current = null;
        pendingRef.current = false;
      });
    return true;
  }

  return (
    <div className="space-y-5">
      <AttendanceQrCamera paused={Boolean(panel)} onDetected={capture} />
      <form
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
        onSubmit={(event) => {
          event.preventDefault();
          capture(reference);
        }}
      >
        <label
          htmlFor="manual-attendance-reference"
          className="block text-sm font-semibold text-ink"
        >
          Ingresar referencia manualmente
        </label>
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
