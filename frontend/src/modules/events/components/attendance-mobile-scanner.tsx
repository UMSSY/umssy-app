'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttendanceQrCamera } from './attendance-qr-camera';
import { parseAttendanceReference } from '../utils/attendance-reference';
import { AttendanceResultPanel } from './attendance-result-panel';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';

type DemoOutcome = 'registered' | 'duplicate' | 'invalid' | 'error';

export function AttendanceMobileScanner() {
  const demo = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_MOCK_MANAGED_WORKSHOPS === 'true';
  const [reference, setReference] = useState('');
  const [panel, setPanel] = useState<AttendancePanelState | null>(null);
  const [demoOutcome, setDemoOutcome] = useState<DemoOutcome>('registered');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  function dismiss() {
    setPanel(null);
    setReference('');
  }

  function capture(value: string) {
    const parsed = parseAttendanceReference(value);
    if (!parsed) {
      setPanel({ kind: 'invalid', message: 'Formato de pase no reconocido. Ingresa una referencia válida o vuelve a escanear.' });
      return true;
    }
    if (!demo) {
      setPanel({ kind: 'error', message: 'El servicio de validación de asistencias aún no está disponible.' });
      return true;
    }
    // SIMULADO: estos resultados solo muestran el panel. Ninguna asistencia llega a backend.
    setPanel({ kind: 'verifying' });
    timerRef.current = setTimeout(() => setPanel({ kind: demoOutcome }), 650);
    return true;
  }

  return (
    <div className="space-y-5">
      <AttendanceQrCamera paused={Boolean(panel)} onDetected={capture} />
      {demo && <div className="space-y-2 rounded-lg border border-dashed border-border-strong bg-surface-soft p-4">
        <p className="text-sm font-semibold text-ink">Simular resultado de validación</p>
        <div role="group" aria-label="Resultado simulado" className="grid grid-cols-2 gap-2">
          {([['registered', 'Registrada'], ['duplicate', 'Duplicada'], ['invalid', 'Inválida'], ['error', 'Error']] as const).map(([outcome, label]) => (
            <Button key={outcome} type="button" size="sm" variant={demoOutcome === outcome ? 'default' : 'outline'} aria-pressed={demoOutcome === outcome} onClick={() => setDemoOutcome(outcome)}>{label}</Button>
          ))}
        </div>
        <p className="text-xs text-text-secondary">Simulación local para revisar el diseño. No registra asistencia.</p>
      </div>}
      <form className="space-y-3 rounded-lg border border-border bg-surface p-4" onSubmit={(event) => { event.preventDefault(); capture(reference); }}>
        <label htmlFor="manual-attendance-reference" className="block text-sm font-semibold text-ink">Ingresar referencia manualmente</label>
        <p className="text-sm text-text-secondary">Si la cámara no lee el pase, escribe su referencia o el ID de inscripción.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="manual-attendance-reference" value={reference} onChange={(event) => setReference(event.target.value.slice(0, 70))} maxLength={70} autoComplete="off" spellCheck={false} placeholder="Referencia o ID de inscripción" className="min-w-0 flex-1" />
          <Button type="submit" disabled={Boolean(panel)}>Validar</Button>
        </div>
      </form>
      {panel && <AttendanceResultPanel state={panel} onDismiss={dismiss} demo={demo} />}
    </div>
  );
}
