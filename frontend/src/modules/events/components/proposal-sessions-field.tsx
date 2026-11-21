'use client';

import type { ProposalSessionsFieldProps } from '../types/proposal-sessions-field-props.types';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DateField } from '@/shared/components/date-field';
import { ProposalField } from './proposal-field';
import { ProposalTimeField } from './proposal-time-field';

export function ProposalSessionsField({ sessions, errors, error, minDate, maxDate, canAdd, disabled, onAdd, onChange, onRemove }: ProposalSessionsFieldProps) {
  return (
    <fieldset className="min-w-0 space-y-4">
      <legend className="text-sm font-semibold text-ink">Sesiones adicionales</legend>
      <p className="text-xs text-text-secondary">Opcional. Usan la misma modalidad y ubicación del taller.</p>
      {sessions.map((session, index) => {
        const id = `proposal-session-${index}`;
        const rowError = errors[index] ?? {};
        return (
          <div key={index} className="space-y-4 rounded-lg border border-border p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">Sesión {index + 2}</p>
              <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onRemove(index)} aria-label={`Quitar sesión ${index + 2}`}>
                <X data-icon="inline-start" aria-hidden="true" />Quitar
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <ProposalField id={`${id}-eventDate`} label="Fecha" error={rowError.eventDate}>
                <DateField id={`${id}-eventDate`} value={session.eventDate} onValueChange={(value) => onChange(index, 'eventDate', value)} className="h-11"
                  initialMonth={minDate} min={minDate} max={maxDate} disabled={disabled}
                  aria-invalid={Boolean(rowError.eventDate)} aria-describedby={rowError.eventDate ? `${id}-eventDate-error` : undefined} />
              </ProposalField>
              <ProposalTimeField id={`${id}-startTime`} label="Hora de inicio" value={session.startTime} endTime={session.endTime}
                onChange={(value) => onChange(index, 'startTime', value)} error={rowError.startTime} disabled={disabled} />
              <ProposalTimeField id={`${id}-endTime`} label="Hora de finalización" value={session.endTime} startTime={session.startTime}
                onChange={(value) => onChange(index, 'endTime', value)} error={rowError.endTime} disabled={disabled} />
            </div>
          </div>
        );
      })}
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Button type="button" variant="outline" disabled={disabled || !canAdd} onClick={onAdd}>
        <Plus data-icon="inline-start" aria-hidden="true" />Agregar sesión
      </Button>
    </fieldset>
  );
}
