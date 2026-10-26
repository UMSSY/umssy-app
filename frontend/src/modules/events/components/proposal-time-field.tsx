'use client';

import type { ProposalTimeFieldProps } from '../types/proposal-time-field-props.types';

import { useState } from 'react';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { formatProposalTime } from '../utils/proposal-format';
import { ProposalField } from './proposal-field';

const HOURS = Array.from({ length: 24 }, (_, index) => String(index).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0'));

export function ProposalTimeField({ id, label, value, onChange, error, disabled }: ProposalTimeFieldProps) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState('09');
  const [minute, setMinute] = useState('00');
  const [editing, setEditing] = useState(false);
  return (
    <ProposalField id={id} label={label} error={error}>
      <div className="relative">
        <Input id={id} value={editing ? value : value ? formatProposalTime(value) : ''} placeholder="hh:mm" inputMode="numeric" required disabled={disabled}
          className="h-11 pr-12" onFocus={() => setEditing(true)} onBlur={() => setEditing(false)}
          onChange={(event) => onChange(event.target.value)} aria-invalid={Boolean(error)} aria-describedby={`${id}-help${error ? ` ${id}-error` : ''}`} />
        <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 size-11" disabled={disabled}
        aria-label={`Seleccionar ${label.toLowerCase()}`} aria-haspopup="dialog"
        onClick={() => { const parts = (value || '09:00').split(':'); setHour(parts[0]); setMinute(parts[1]); setOpen(true); }}>
        <Clock aria-hidden="true" />
        </Button>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>Selecciona la hora en formato de 24 horas.</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label htmlFor={`${id}-hours`}>Hora (00–23)</Label>
              <Select value={hour} onValueChange={(next) => { if (next) setHour(next); }}>
                <SelectTrigger id={`${id}-hours`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{HOURS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label htmlFor={`${id}-minutes`}>Minutos</Label>
              <Select value={minute} onValueChange={(next) => { if (next) setMinute(next); }}>
                <SelectTrigger id={`${id}-minutes`} className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>{MINUTES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <p className="text-sm text-text-secondary">Se mostrará como {formatProposalTime(`${hour}:${minute}`)}.</p>
          <Button type="button" onClick={() => { onChange(`${hour}:${minute}`); setOpen(false); }}>Usar hora</Button>
        </DialogContent>
      </Dialog>
    </ProposalField>
  );
}