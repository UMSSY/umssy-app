'use client';

import { useEffect, useRef } from 'react';
import type { RadarAreaDetailsDialogProps } from '../types/radar-area-details-dialog-props.types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { XIcon } from 'lucide-react';
import { useMobileViewport } from '../hooks/use-mobile-viewport';
import { getAreaLevel } from '../utils/get-area-level';

const decimal = (value: number) =>
  value.toLocaleString('es-BO', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

export function RadarAreaDetailsDialog({
  areaName,
  position,
  score,
  globalAverage,
  evidence,
  loading = false,
  error = '',
  onRetry,
  onClose,
  subtitle = 'Información relevante del candidato seleccionado',
  footer,
}: RadarAreaDetailsDialogProps) {
  const isMobile = useMobileViewport();
  const savedScrollYRef = useRef<number | null>(null);

  useEffect(() => {
    if (savedScrollYRef.current === null) {
      savedScrollYRef.current = window.scrollY;
    }
    return () => {
      if (savedScrollYRef.current !== null) {
        window.scrollTo({ top: savedScrollYRef.current, behavior: 'instant' });
      }
    };
  }, []);

  const handleClose = () => {
    const targetScrollY = savedScrollYRef.current;
    onClose();
    if (targetScrollY !== null) {
      requestAnimationFrame(() => {
        window.scrollTo({ top: targetScrollY, behavior: 'instant' });
      });
    }
  };

  const gap = score - globalAverage;
  const level = getAreaLevel(score);
  const levelClass = 'bg-surface-soft text-ink border border-border';
  const total = evidence.education.length + evidence.certifications.length;
  const hasAnyEvidence =
    total > 0 ||
    evidence.experiences.length > 0 ||
    evidence.tags.length > 0;

  const detailsBody = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
      <div className="grid gap-0 border-b border-border bg-surface-soft sm:grid-cols-3 sm:divide-x sm:divide-border">
        <div className="p-4 sm:p-5">
          <p className="text-xs text-text-secondary uppercase">
            Puntuación del área
          </p>
          <p className="mt-1 text-2xl font-bold text-ink tabular-nums">
            {decimal(score)}{' '}
            <span className="text-sm font-normal">/ 10</span>
          </p>
          <Progress
            value={Math.max(0, Math.min(100, score * 10))}
            aria-label={`Puntaje de ${areaName}`}
            className="mt-2"
          />
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-text-secondary uppercase">Nivel</p>
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-sm font-semibold ${levelClass}`}
          >
            {level}
          </span>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-xs text-text-secondary uppercase">
            Brecha vs. media
          </p>
          <p className="mt-1 text-xl font-bold text-ink tabular-nums">
            {gap < 0 ? '↘ ' : gap > 0 ? '↗ ' : '→ '}
            {gap > 0 ? '+' : ''}
            {decimal(gap)}
          </p>
          <p className="text-sm text-text-secondary">
            vs. media global {decimal(globalAverage)}
          </p>
        </div>
      </div>

      {loading ? (
        <p role="status" className="p-5 text-sm text-text-secondary">
          Consultando evidencias autorizadas…
        </p>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="m-4 rounded-md border border-border p-3 text-sm text-destructive sm:m-5"
        >
          {error}
          {onRetry ? (
            <Button
              className="ml-2 min-h-12"
              variant="outline"
              size="sm"
              onClick={onRetry}
            >
              Reintentar
            </Button>
          ) : null}
        </div>
      ) : null}

      {!loading && !hasAnyEvidence ? (
        <div className="p-6 text-center">
          <p className="text-sm font-medium text-text-secondary">
            Sin información registrada
          </p>
          {footer ? <div className="mt-4">{footer}</div> : null}
        </div>
      ) : (
        <div className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          <section
            className="min-w-0 p-4 sm:p-5"
            aria-label="Cursos y certificaciones"
          >
            <h3 className="mb-3 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase">
              <span>Cursos y certificaciones</span>
              <span className="text-text-secondary">{total}</span>
            </h3>
            {evidence.education.length ? (
              <div className="mb-4">
                <h4 className="mb-2 text-sm font-semibold text-primary">
                  Formación académica y cursos
                </h4>
                {evidence.education.map((e) => (
                  <div
                    key={e.id}
                    className="border-b border-border py-2.5 text-sm"
                  >
                    <div className="flex justify-between gap-2">
                      <strong className="text-ink">{e.degree}</strong>
                      <span className="shrink-0 text-sm text-text-secondary">
                        {e.year ?? '—'}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {e.institution}
                    </p>
                    {e.description ? (
                      <p className="mt-1 text-sm text-text-secondary">
                        {e.description}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
            {evidence.certifications.length ? (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-text-secondary">
                  Certificaciones
                </h4>
                {evidence.certifications.map((c) => (
                  <article
                    key={c.id}
                    className="mb-2 rounded-lg border border-border bg-surface-soft p-3 text-sm"
                  >
                    <strong>{c.name}</strong>
                    <p className="text-sm text-text-secondary">
                      {c.issuer} · {c.year ?? '—'}
                    </p>
                    {c.credentialId ? (
                      <p className="mt-1 font-mono text-xs break-all">
                        ID {c.credentialId}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            ) : null}
            {!total && !loading ? (
              <p className="text-sm text-text-secondary">
                No se encontraron cursos o certificaciones.
              </p>
            ) : null}
          </section>

          <section className="min-w-0 p-4 sm:p-5" aria-label="Experiencia">
            <h3 className="mb-3 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase">
              <span>Experiencia</span>
              <span className="text-text-secondary">
                {evidence.experiences.length}
              </span>
            </h3>
            {evidence.experiences.map((e) => (
              <article
                key={e.id}
                className="mb-4 border-b border-border pb-3 text-sm"
              >
                <div className="flex items-start gap-2">
                  <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" />
                  <div>
                    <strong>{e.position}</strong>
                    <p className="mt-1 text-sm text-text-secondary">
                      {e.companyName} · {e.duration}
                    </p>
                    {e.description ? (
                      <p className="mt-2 text-sm text-text-secondary">
                        {e.description}
                      </p>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
            {!evidence.experiences.length && !loading ? (
              <p className="text-sm text-text-secondary">
                No se encontró evidencia documentada.
              </p>
            ) : null}
          </section>

          <section
            className="min-w-0 p-4 sm:p-5"
            aria-label="Otras habilidades verificadas"
          >
            <h3 className="mb-3 flex justify-between gap-2 text-xs font-bold tracking-wide text-ink uppercase">
              <span>Otros</span>
              <span className="text-text-secondary">
                {evidence.tags.length}
              </span>
            </h3>
            {evidence.tags.length ? (
              <div className="flex flex-wrap gap-2">
                {evidence.tags.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-border bg-surface-soft px-3 py-1 text-sm text-ink"
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : !loading ? (
              <p className="text-sm text-text-secondary">
                No se encontró evidencia documentada.
              </p>
            ) : null}
            {footer ? <div className="mt-4">{footer}</div> : null}
          </section>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Sheet
        open
        onOpenChange={(open) => {
          if (!open) handleClose();
        }}
      >
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex max-h-[85dvh] flex-col gap-0 overflow-hidden rounded-t-2xl border-t-[3px] border-t-primary bg-surface p-0"
        >
          <div className="flex justify-center pt-2.5 pb-1" aria-hidden="true">
            <span className="h-1.5 w-10 rounded-full bg-border-strong" />
          </div>
          <SheetHeader className="shrink-0 border-b border-border px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="mb-1 flex items-center gap-2 text-xs font-bold tracking-wide text-primary uppercase">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {position}
                  </span>
                  Área de competencia
                </p>
                <SheetTitle className="text-lg font-bold text-ink">
                  {areaName}
                </SheetTitle>
                <SheetDescription className="mt-0.5 text-sm">
                  {subtitle}
                </SheetDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="size-12 shrink-0"
                onClick={handleClose}
                aria-label="Cerrar detalle del área"
              >
                <XIcon className="size-5" />
              </Button>
            </div>
          </SheetHeader>
          {detailsBody}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) handleClose();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90vh,840px)] w-full max-w-[calc(100vw-1.5rem)] flex-col gap-0 overflow-hidden border-t-[3px] border-t-primary p-0 sm:max-w-5xl"
      >
        <DialogHeader className="shrink-0 border-b border-border px-5 py-4 sm:px-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 flex items-center gap-2 text-[11px] font-bold tracking-wide text-primary uppercase">
                <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {position}
                </span>{' '}
                Área de afinidad
              </p>
              <DialogTitle className="text-xl font-bold text-ink">
                {areaName}
              </DialogTitle>
              <DialogDescription className="mt-1">{subtitle}</DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-12"
              onClick={handleClose}
              aria-label="Cerrar detalle del área"
            >
              Cerrar ×
            </Button>
          </div>
        </DialogHeader>
        {detailsBody}
      </DialogContent>
    </Dialog>
  );
}

export type { AreaEvidenceDetails } from '../types/radar-evidence-details.types';
export { EMPTY_AREA_EVIDENCE } from '../constants/radar-area-evidence.constants';