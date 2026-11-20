'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useMentorDirectory } from '@/modules/mentorship';
import type { ProjectionProps } from '../types/projection-props.types';

const ILLUSTRATIVE_GAIN = 1;
const format = (value: number) =>
  value.toLocaleString('es-BO', { maximumFractionDigits: 2 });

export function MentorshipProjection(props: ProjectionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const changeOpen = (open: boolean) => {
    setIsExpanded(open);
    props.onOpenChange?.(open);
  };
  const notifyOpen = props.onOpenChange;
  useEffect(() => () => notifyOpen?.(false), [notifyOpen]);
  return (
    <Dialog open={isExpanded} onOpenChange={changeOpen}>
      <DialogTrigger render={<Button className="w-full" />}>
        {props.triggerLabel ?? "Simular habilidad"}
      </DialogTrigger>
      {isExpanded ? (
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Simular habilidad: {props.area.name}</DialogTitle>
            <DialogDescription>
              Compara tu puntaje actual con una estimación al completar una
              mentoría. Tu radar real se conserva.
            </DialogDescription>
          </DialogHeader>
          <MentorshipProjectionResult {...props} />
          <Button variant="outline" onClick={() => changeOpen(false)}>
            Cerrar simulación
          </Button>
        </DialogContent>
      ) : null}
    </Dialog>
  );
}

function MentorshipProjectionResult({
  area,
  areas,
  onProjectionChange,
}: ProjectionProps) {
  const { data, isPending, isError, isFetching, refetch } = useMentorDirectory({
    page: 1,
    search: '',
    area: area.name,
    available: true,
    sort: 'default',
  });
  const count = data?.totalItems ?? 0;
  const projected = Math.min(
    10,
    area.score + (count > 0 ? ILLUSTRATIVE_GAIN : 0),
  );
  const gain = Number((projected - area.score).toFixed(2));
  const average =
    areas.reduce(
      (sum, item) => sum + (item.id === area.id ? projected : item.score),
      0,
    ) / areas.length;

  useEffect(() => {
    onProjectionChange?.(
      !isPending && !isError && count > 0
        ? { areaId: area.id, score: projected }
        : null,
    );
    return () => onProjectionChange?.(null);
  }, [area.id, projected, count, isPending, isError, onProjectionChange]);

  return (
    <div className="space-y-3 border-t border-border pt-3" aria-live="polite">
      <h3 className="text-sm font-semibold">Proyección con mentoría</h3>
      {isPending ? (
        <p role="status" className="text-sm text-text-secondary">
          Consultando mentores disponibles...
        </p>
      ) : isError ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>
            No pudimos comprobar la disponibilidad de mentores. La proyección no
            está disponible.
          </p>
          <Button
            variant="outline"
            size="sm"
            disabled={isFetching}
            onClick={() => {
              void refetch();
            }}
          >
            Reintentar consulta
          </Button>
        </div>
      ) : (
        <>
          <p className="text-sm">
            {count > 0
              ? `${count} ${count === 1 ? 'mentor disponible' : 'mentores disponibles'} en esta área.`
              : 'No hay mentores disponibles para esta área. Se conserva tu puntaje actual.'}
          </p>
          <p className="font-semibold" aria-label="Resumen de proyección">
            {format(area.score)} → {format(projected)} / 10{' '}
            <span className="text-sm font-normal">
              (+{format(gain)} estimado)
            </span>
          </p>
          <div className="space-y-2 text-sm">
            <div
              className="relative h-3 overflow-hidden rounded-full bg-border"
              role="meter"
              aria-label="Puntaje proyectado"
              aria-valuenow={projected}
              aria-valuemin={0}
              aria-valuemax={10}
              aria-valuetext={`${format(area.score)} actual; +${format(gain)} estimado; ${format(projected)} de 10`}
            >
              <div
                className="absolute inset-y-0 left-0 bg-success"
                style={{ width: `${projected * 10}%` }}
              />
              <div
                className="absolute inset-y-0 left-0 bg-accent"
                style={{ width: `${area.score * 10}%` }}
              />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-accent"
                />
                Actual: {format(area.score)}
              </span>
              <span className="flex items-center gap-1">
                <span
                  aria-hidden="true"
                  className="size-2 rounded-full bg-success"
                />
                Aumento estimado: +{format(gain)}
              </span>
            </div>
          </div>
          <p className="text-sm">
            Promedio global proyectado: <strong>{format(average)} / 10</strong>
          </p>
          {count > 0 ? (
            <p className="text-xs text-text-secondary">
              Estimación ilustrativa de hasta +1 punto al completar una
              mentoría. No garantiza una mejora ni modifica tu radar publicado.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
