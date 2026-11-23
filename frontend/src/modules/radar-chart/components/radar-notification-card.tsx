
'use client';

import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RadarNotification } from '../types/radar-notification.types';

interface RadarNotificationCardProps {
  notification: RadarNotification;
  onClose: () => void;
  onOpen: () => void;
  isOpening: boolean;
}

function formatNotificationDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return 'Fecha no disponible';

  return new Intl.DateTimeFormat('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
    .format(date)
    .replace(',', ' -')
    .replace(/\b(a\. m\.|p\. m\.)/i, (period) => period.toLowerCase());
}

export function RadarNotificationCard({
  notification,
  onClose,
  onOpen,
  isOpening,
}: RadarNotificationCardProps) {
  const isUnread = notification.readAt === null;

  return (
    <section
      aria-label="Centro de notificaciones"
      className="rounded-lg border border-border bg-surface p-5"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-accent">
            Centro de notificaciones
          </p>
          <h2 className="mt-1 text-xl font-semibold text-ink">
            Notificaciones
          </h2>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Cerrar notificación"
          onClick={onClose}
          className="text-text-secondary hover:bg-surface-soft"
        >
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>


    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2 text-sm font-medium text-accent">
        <span className="relative inline-flex">
          <Bell aria-hidden="true" className="size-4" />
          {isUnread ? (
            <span
              aria-label="No leída"
              className="absolute -top-1 -right-1 size-2 rounded-full bg-destructive"
            />
          ) : null}
        </span>
        <span>Radar de afinidad</span>
      </div>

      <time
        dateTime={notification.createdAt}
        className="text-xs text-text-secondary"
      >
        {formatNotificationDate(notification.createdAt)}
      </time>
    </div>

      <h3 className="mt-4 font-semibold text-ink">
        Tu radar se ha actualizado
      </h3>

      <p className="mt-1 text-sm text-text-secondary">
        Se publicó la versión {notification.version} de tu Radar de afinidad.
        Consulta tus resultados y áreas de afinidad actualizadas.
      </p>

      <Button
        type="button"
        variant="link"
        disabled={isOpening}
        onClick={onOpen}
        className="mt-4 h-auto p-0 text-sm font-medium"
      >
        {isOpening ? 'Abriendo radar...' : 'Ver mi radar →'}
      </Button>
    </section>
  );
}