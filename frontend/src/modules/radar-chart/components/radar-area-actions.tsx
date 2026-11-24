'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { AreaLevelBadge } from './area-level-badge';
import { getAreaLevel } from '../utils/get-area-level';
import type { RadarAreaScore } from '../types/radar-area-score.types';

export function RadarAreaActions({
  area,
  onSimulate,
}: {
  area: RadarAreaScore;
  onSimulate: () => void;
}) {
  return (
    <section
      aria-label="Competencia seleccionada"
      className="space-y-3 border border-border bg-surface p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[11px] font-bold tracking-[0.14em] text-ink-soft uppercase">
          Área seleccionada
        </p>
        <AreaLevelBadge level={getAreaLevel(area.score)} />
      </div>
      <h3 className="[font-family:Georgia,serif] text-[27px] leading-tight font-semibold text-accent">
        {area.name}
      </h3>
      <p className="text-4xl leading-tight font-bold text-accent tabular-nums">
        {area.score.toLocaleString('es-BO')}{' '}
        <span className="text-xs font-normal text-text-secondary">/ 10</span>
      </p>
      <div
        className="h-1.5 overflow-hidden rounded-full bg-border"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full bg-accent"
          style={{ width: `${area.score * 10}%` }}
        />
      </div>
      <p className="text-xs leading-5 text-text-secondary">
        Este puntaje refleja tus habilidades verificadas en {area.name}. Explora
        cómo potenciar esta área o encuentra un mentor que te acompañe.
      </p>
      <div className="flex flex-col gap-2">
        <Button
          type="button"
          variant="outline"
          className="h-[49px] w-full flex-col items-start justify-center gap-0 rounded-sm border-accent/50 bg-surface-soft px-3 text-xs text-accent"
          aria-label="Simular una habilidad"
          onClick={onSimulate}
        >
          Simular una habilidad
          <span className="text-[10px] font-normal text-text-secondary">Proyección sin publicar</span>
        </Button>
        <Link
          className={buttonVariants({
            className:
              'h-11 w-full gap-4 rounded-sm bg-accent text-xs text-accent-foreground hover:bg-accent/90',
          })}
          href={`/mentorship/mentors?radarArea=${area.id}`}
        >
          Ver mentores de esta área
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </section>
  );
}
