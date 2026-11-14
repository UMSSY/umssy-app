import { CalendarDays, Clock3, MapPin, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { formatRegistrationDate, formatRegistrationTime } from '../utils/registration-format';
import type { ManagedWorkshop } from '../types/managed-workshop.types';

interface ManagedWorkshopCardProps {
  workshop: ManagedWorkshop;
  finished: boolean;
  onRegisterAttendance: (workshop: ManagedWorkshop, finished: boolean) => void;
}

export function ManagedWorkshopCard({ workshop, finished, onRegisterAttendance }: ManagedWorkshopCardProps) {
  return (
    <Card className="flex flex-col gap-4 rounded-lg border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-ink">{workshop.title}</h2>
          <span className={finished ? 'rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-text-secondary' : 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'}>
            {finished ? 'Finalizado' : 'Activo'}
          </span>
        </div>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />{formatRegistrationDate(workshop.eventDate)}</p>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{formatRegistrationTime(workshop.startTime)} – {formatRegistrationTime(workshop.endTime)}</p>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><MapPin aria-hidden="true" className="size-4 shrink-0" />{workshop.location?.trim() || 'Lugar por confirmar'}</p>
      </div>
      <Button type="button" className="w-full shrink-0 sm:w-auto" onClick={() => onRegisterAttendance(workshop, finished)}>
        <ScanLine aria-hidden="true" />Registrar asistencias
      </Button>
    </Card>
  );
}
