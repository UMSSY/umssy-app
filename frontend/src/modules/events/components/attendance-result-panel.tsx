'use client';

import { useEffect, useRef } from 'react';
import { AlertCircle, Check, CircleX, LoaderCircle, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttendancePanelState } from '../types/attendance-panel-state.types';

interface AttendanceResultPanelProps {
  state: AttendancePanelState;
  onDismiss: () => void;
}

export function AttendanceResultPanel({ state, onDismiss }: AttendanceResultPanelProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const verifying = state.kind === 'verifying';
  useEffect(() => { headingRef.current?.focus(); }, [state.kind]);
  useEffect(() => {
    if (verifying) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onDismiss();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [verifying, onDismiss]);

  const content = {
    verifying: { title: 'Verificando entrada...', description: 'Validando el pase y registrando la asistencia.', icon: LoaderCircle, color: 'text-accent' },
    registered: { title: 'Asistencia registrada', description: 'Pase válido. La entrada del participante fue registrada correctamente.', icon: Check, color: 'text-success' },
    duplicate: { title: 'Asistencia ya registrada', description: 'Este pase ya tiene una asistencia registrada.', icon: AlertCircle, color: 'text-accent' },
    invalid: { title: 'Pase inválido', description: state.kind === 'invalid' ? state.message ?? 'No se pudo validar este pase. Verifica que corresponda al taller y que la inscripción esté vigente.' : '', icon: CircleX, color: 'text-danger' },
    error: { title: 'No se pudo verificar la entrada', description: state.kind === 'error' ? state.message ?? 'Revisa la conexión e inténtalo de nuevo.' : '', icon: AlertCircle, color: 'text-danger' },
  }[state.kind];
  const Icon = content.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <Button type="button" variant="ghost" tabIndex={verifying ? -1 : 0} aria-disabled={verifying} aria-label="Cerrar resultado y volver a escanear" onClick={() => { if (!verifying) onDismiss(); }} className="absolute inset-0 size-full rounded-none bg-black/50 p-0 hover:bg-black/50 aria-disabled:cursor-wait" />
      <section role="dialog" aria-labelledby="attendance-result-title" aria-describedby="attendance-result-description" aria-busy={verifying} className="relative w-full max-w-lg rounded-t-3xl bg-surface p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-center shadow-xl">
        <div aria-hidden="true" className="mx-auto mb-5 h-1 w-12 rounded-full bg-border-strong" />
        <Icon aria-hidden="true" className={`mx-auto mb-4 size-14 ${content.color} ${verifying ? 'animate-spin' : ''}`} />
        <h2 ref={headingRef} tabIndex={-1} id="attendance-result-title" className="text-xl font-bold text-ink outline-none">{content.title}</h2>
        <p id="attendance-result-description" className="mt-2 text-sm text-text-secondary">{content.description}</p>
        {(state.kind === 'registered' || state.kind === 'duplicate') && state.sessionLabel && <p className="mt-2 text-sm font-semibold text-ink first-letter:uppercase">{state.sessionLabel}</p>}
        {!verifying && <div className="mt-6 space-y-2">
          <Button type="button" className="w-full" onClick={onDismiss}><ScanLine aria-hidden="true" />{state.kind === 'invalid' || state.kind === 'error' ? 'Escanear nuevamente' : 'Escanear siguiente'}</Button>
          {state.kind === 'registered' && <Button type="button" variant="outline" disabled title="Registro del taller próximamente" className="w-full">Ver registro del taller</Button>}
        </div>}
      </section>
    </div>
  );
}
