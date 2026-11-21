'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { ArrowLeft, Smartphone } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { buttonVariants } from '@/components/ui/button-variants';
import { Card } from '@/components/ui/card';
import { PageHeading } from '@/shared/components/layout';
import { RequestFeedback } from '../components/request-feedback';
import { useManagedWorkshops } from '../hooks/use-managed-workshops';
import { isManagedWorkshopFinished } from '../utils/managed-workshop-status';
import {
  formatRegistrationDate,
  formatRegistrationTime,
} from '../utils/registration-format';
import { AttendanceMobileScanner } from '../components/attendance-mobile-scanner';
import type { AttendanceHandoffViewProps } from '../types/attendance-handoff-view-props.types';

const subscribeViewport = (callback: () => void) => {
  if (typeof window.matchMedia !== 'function') return () => {};
  const query = window.matchMedia('(max-width: 1023px)');
  query.addEventListener('change', callback);
  return () => query.removeEventListener('change', callback);
};
const isMobileViewport = () =>
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(max-width: 1023px)').matches;
const serverViewport = () => false;

export function AttendanceHandoffView({
  workshopId,
}: AttendanceHandoffViewProps) {
  const { workshops, isLoading, error, retry } = useManagedWorkshops();
  const origin = useSyncExternalStore(
    () => () => {},
    () => window.location.origin,
    () => '',
  );
  const isMobile = useSyncExternalStore(
    subscribeViewport,
    isMobileViewport,
    serverViewport,
  );
  const scanUrl = origin
    ? new URL(
        `/events/my-workshops/${encodeURIComponent(workshopId)}/attendance`,
        origin,
      ).toString()
    : '';
  const [now, setNow] = useState(Date.now);
  const workshop = workshops.find((item) => item.id === workshopId);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6">
      <Link
        href="/events/my-workshops"
        className={buttonVariants({ variant: 'ghost', className: 'w-fit' })}
      >
        <ArrowLeft aria-hidden="true" />
        Mis talleres
      </Link>
      <PageHeading
        title="Registrar asistencias"
        description={workshop?.title ?? 'Taller seleccionado'}
      />
      {isLoading ? (
        <RequestFeedback message="Verificando el taller..." />
      ) : error ? (
        <RequestFeedback message={error} isError onRetry={retry} />
      ) : !workshop ? (
        <RequestFeedback
          message="Este taller no está entre los talleres que puedes gestionar."
          isError
        />
      ) : isManagedWorkshopFinished(workshop, now) ? (
        <RequestFeedback
          message="Fuera de la ventana horaria de validación. El taller ha finalizado."
          isError
        />
      ) : (
        <>
          <Card className="gap-2 border-border bg-surface p-5">
            <h2 className="font-semibold text-ink">{workshop.title}</h2>
            <p className="text-sm text-text-secondary">
              {formatRegistrationDate(workshop.eventDate)} ·{' '}
              {formatRegistrationTime(workshop.startTime)} –{' '}
              {formatRegistrationTime(workshop.endTime)}
            </p>
            <p className="text-sm text-text-secondary">
              {workshop.location?.trim() || 'Lugar por confirmar'}
            </p>
          </Card>
          <Card className="hidden items-center gap-5 border-border bg-surface p-8 text-center lg:flex">
            <Smartphone aria-hidden="true" className="size-12 text-accent" />
            <h2 className="text-xl font-semibold text-ink">
              Continúa en tu celular
            </h2>
            <p className="max-w-md text-sm text-text-secondary">
              Escanea este código para abrir la vista de asistencia de este
              taller. Inicia sesión con la cuenta autorizada en el celular.
            </p>
            {scanUrl && (
              <QRCodeSVG
                xmlns="http://www.w3.org/2000/svg"
                value={scanUrl}
                level="M"
                marginSize={4}
                size={220}
                role="img"
                title="Enlace para continuar en el celular"
                aria-label="Código QR para continuar en el celular"
              />
            )}
            {scanUrl && (
              <a
                href={scanUrl}
                className="max-w-full text-sm break-all text-accent underline"
              >
                {scanUrl}
              </a>
            )}
          </Card>
          {isMobile && (
            <div className="lg:hidden">
              <AttendanceMobileScanner workshopId={workshopId} />
            </div>
          )}
        </>
      )}
    </main>
  );
}
