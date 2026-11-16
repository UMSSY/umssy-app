'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AttendanceQrCamera } from './attendance-qr-camera';
import { parseAttendanceReference } from '../utils/attendance-reference';

export function AttendanceMobileScanner() {
  const [reference, setReference] = useState('');
  const [captured, setCaptured] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function capture(value: string) {
    const parsed = parseAttendanceReference(value);
    if (!parsed) {
      setError('Formato de pase no reconocido. Ingresa una referencia válida o vuelve a escanear.');
      setCaptured(null);
      return false;
    }
    setError(null);
    setCaptured(parsed);
    return true;
  }

  return (
    <div className="space-y-5">
      <AttendanceQrCamera paused={Boolean(captured)} onDetected={capture} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      {captured && <div role="status" className="space-y-3 rounded-lg border border-border bg-surface p-4">
        <p className="font-semibold text-ink">Referencia capturada</p>
        <p className="text-sm text-text-secondary">La validación y el registro con el servidor se conectarán en una tarea posterior.</p>
        <Button type="button" variant="outline" onClick={() => { setCaptured(null); setReference(''); }}>Escanear otro pase</Button>
      </div>}
      <form className="space-y-3 rounded-lg border border-border bg-surface p-4" onSubmit={(event) => { event.preventDefault(); capture(reference); }}>
        <label htmlFor="manual-attendance-reference" className="block text-sm font-semibold text-ink">Ingresar referencia manualmente</label>
        <p className="text-sm text-text-secondary">Si la cámara no lee el pase, escribe su referencia o el ID de inscripción.</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="manual-attendance-reference" value={reference} onChange={(event) => { setReference(event.target.value.slice(0, 70)); setError(null); }} maxLength={70} autoComplete="off" spellCheck={false} placeholder="Referencia o ID de inscripción" className="min-w-0 flex-1" />
          <Button type="submit" disabled={Boolean(captured)}>Validar</Button>
        </div>
      </form>
    </div>
  );
}
