import { CalendarDays, Clock3, MapPin, ScanLine } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button-variants';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { toast } from 'sonner';
import { formatRegistrationDate, formatRegistrationTime } from '../utils/registration-format';
import type { ManagedWorkshop } from '../types/managed-workshop.types';
import { formatSessionCount, formatSessionDateRange, getScheduleBounds, getSortedSessions } from '../utils/event-sessions';

interface ManagedWorkshopCardProps {
  workshop: ManagedWorkshop;
  finished: boolean;
}

export function ManagedWorkshopCard({ workshop, finished }: ManagedWorkshopCardProps) {
  const sessions = getSortedSessions(workshop);
  const isMultiSession = sessions.length > 1;
  const earlyOpeningMs = 30 * 60 * 1000;
  return (
    <Card className="flex flex-col gap-4 rounded-lg border-border bg-surface p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-semibold text-ink">{workshop.title}</h2>
          <span className={finished ? 'rounded-full bg-surface-soft px-2.5 py-0.5 text-xs font-semibold text-text-secondary' : 'rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-800'}>
            {finished ? 'Finalizado' : 'Activo'}
          </span>
        </div>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><CalendarDays aria-hidden="true" className="size-4 shrink-0" />{isMultiSession ? formatSessionDateRange(sessions) : formatRegistrationDate(workshop.eventDate)}</p>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><Clock3 aria-hidden="true" className="size-4 shrink-0" />{isMultiSession ? formatSessionCount(sessions.length) : `${formatRegistrationTime(workshop.startTime)} – ${formatRegistrationTime(workshop.endTime)}`}</p>
        <p className="flex items-center gap-2 text-sm text-text-secondary"><MapPin aria-hidden="true" className="size-4 shrink-0" />{workshop.location?.trim() || 'Lugar por confirmar'}</p>
      </div>
      {!finished && (
        <Link href={`/events/my-workshops/${encodeURIComponent(workshop.id)}/attendance`} onClick={(event) => {
          const now = Date.now();
          const { startsAt, endsAt } = getScheduleBounds({ ...workshop, date: workshop.eventDate });
          const inWindow = sessions.length
            ? sessions.some((session) => now >= Date.parse(session.startsAt) - earlyOpeningMs && now < Date.parse(session.endsAt))
            : now >= startsAt - earlyOpeningMs && now < endsAt;
          if (!inWindow) {
            event.preventDefault();
            toast.info('Taller fuera de horario. El registro se habilitará durante el horario de la sesión.');
          }
        }} className={buttonVariants({ className: 'w-full shrink-0 sm:w-auto' })}>
          <ScanLine aria-hidden="true" />Registrar asistencias
        </Link>
      )}
    </Card>
  );
}
