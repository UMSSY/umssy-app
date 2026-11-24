'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogPopup,
  DialogPortal,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  NativeSelect,
  NativeSelectOptGroup,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { ArrowRight, X } from 'lucide-react';
import type { AreaId } from '../types/area-id.types';
import type { RadarAreaScore } from '../types/radar-area-score.types';
import { projectRadarScore } from '../utils/project-radar-score';
import type { SkillItem } from '@/modules/skills/types/skill-item.types';
import type { Epic2Skill } from '../types/epic2-skill.types';
import type { RadarSimulationEligibility } from '../types/radar-simulation-eligibility.types';
import type { Projection } from '../types/projection.types';

export function SkillSimulationDialog({
  areas,
  initialArea,
  catalog = [],
  approved = [],
  verification,
  verificationError = false,
  onRetry,
  onProjectionChange,
  availability,
  onClose,
}: {
  areas: RadarAreaScore[];
  initialArea: AreaId;
  catalog?: readonly SkillItem[];
  approved?: readonly Pick<Epic2Skill, 'id' | 'name'>[];
  verification?: RadarSimulationEligibility;
  verificationError?: boolean;
  onRetry?: () => void;
  onProjectionChange?: (value: Projection) => void;
  availability?: ReactNode;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState<{
    id: string;
    verification: RadarSimulationEligibility;
  } | null>(null);
  if (selection && (verificationError || (verification && selection.verification !== verification))) {
    setSelection(null);
  }
  const verified = [...approved, ...(verification?.approved ?? [])];
  const verifiedIds = new Set(verified.map(({ id }) => id));
  const verifiedNames = new Set(verified.map(({ name }) => name.trim().toLowerCase()));
  const skills = verification
    ? [...new Map(catalog.map((skill) => [skill.id, skill])).values()]
        .filter(({ id, name, areaId, radarPoints }) =>
          radarPoints !== undefined &&
          areas.some((area) => area.id === areaId) &&
          !verifiedIds.has(id) && !verifiedNames.has(name.trim().toLowerCase()),
        )
    : [];
  const skill = selection?.verification === verification
    ? skills.find(({ id }) => id === selection?.id)
    : undefined;
  const area = areas.find(({ id }) => id === (skill?.areaId ?? initialArea))!;
  const highRelevance = skill && verification?.highRelevanceSkillIds.includes(skill.id);
  const points = highRelevance
    ? skill?.radarHighRelevancePoints ?? skill?.radarPoints
    : skill?.radarPoints;
  const result = projectRadarScore(areas, area.id, area.score + (points ?? 0));
  const hasSkill = Boolean(skill);

  useEffect(() => {
    onProjectionChange?.(hasSkill ? { areaId: area.id, score: result.score } : null);
    return () => onProjectionChange?.(null);
  }, [area.id, hasSkill, onProjectionChange, result.score]);

  const decimal = (value: number) =>
    value.toLocaleString('es-BO', { maximumFractionDigits: 2 });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogPortal>
        <DialogOverlay className="bg-[#102a43]/60 backdrop-blur-[2px]" />
        <DialogPopup className="fixed top-1/2 left-1/2 z-50 max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-[650px] -translate-1/2 overflow-y-auto border-t-4 border-accent bg-surface text-ink shadow-[0_28px_60px_#102a4340] outline-none">
          <DialogHeader className="gap-2 border-b border-border px-4 pt-[29px] pb-[18px] sm:px-7">
            <span className="mb-1 w-fit rounded-[2px] bg-[#ffedb8] px-2 py-1 text-[9px] leading-[14px] font-bold tracking-widest text-[#6c5624]">
              SIMULADA
            </span>
            <DialogTitle className="text-[27px] leading-8 font-semibold text-accent" style={{ fontFamily: 'Georgia, serif' }}>
              Proyecta una habilidad
            </DialogTitle>
            <DialogDescription className="text-xs leading-5 text-text-secondary">
              Consulta cómo cambiaría tu puntaje si mejoras la competencia
              seleccionada.
            </DialogDescription>
            <DialogClose
              aria-label="Close"
              className="absolute top-[25px] right-4 grid size-[34px] place-items-center rounded-sm border border-border text-text-secondary hover:bg-interaction focus-visible:outline-2 focus-visible:outline-accent sm:right-7"
            >
              <X className="size-4" aria-hidden="true" />
            </DialogClose>
          </DialogHeader>
          <div className="space-y-[18px] px-4 py-5 sm:px-7">
            {availability}
            <div className="space-y-2">
              <Label
                htmlFor="simulation-area"
                className="text-[11px] leading-4 font-bold tracking-wide text-ink-soft uppercase"
              >
                Habilidad no verificada
              </Label>
              <NativeSelect
                className="w-full [&_select]:h-[46px] [&_select]:rounded-sm [&_select]:text-[13px]"
                id="simulation-area"
                aria-label="Competencia"
                value={skill?.id ?? ''}
                disabled={!verification}
                onChange={(event) => {
                  if (verification) {
                    setSelection({ id: event.target.value, verification });
                  }
                }}
              >
                <NativeSelectOption value="">Selecciona una habilidad</NativeSelectOption>
                {areas.map((item) => (
                  <NativeSelectOptGroup key={item.id} label={item.name}>
                    {skills
                      .filter((skill) => skill.areaId === item.id)
                      .map((skill) => (
                        <NativeSelectOption key={skill.id} value={skill.id}>
                          {skill.name}
                        </NativeSelectOption>
                      ))}
                  </NativeSelectOptGroup>
                ))}
              </NativeSelect>
              {verificationError ? (
                <div className="flex flex-wrap items-center gap-2">
                  <p role="alert" className="text-[11px] leading-4 text-text-secondary">
                    No pudimos verificar las habilidades disponibles.
                  </p>
                  <Button type="button" size="sm" variant="outline" onClick={onRetry}>
                    Reintentar
                  </Button>
                </div>
              ) : !verification ? (
                <p role="status" className="text-[11px] leading-4 text-text-secondary">
                  Consultando el estado de las habilidades…
                </p>
              ) : (
                <p className="text-[11px] leading-4 text-text-secondary">
                  Selecciona una habilidad del catálogo pendiente de verificar.
                </p>
              )}
            </div>
            <section className="space-y-2 border border-border bg-surface-soft p-3 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-bold tracking-widest text-text-secondary uppercase">
                    Eje impactado
                  </p>
                  <h3 className="mt-1 text-sm font-semibold text-ink">
                    {area.name}
                  </h3>
                </div>
                <span className="rounded-[2px] bg-interaction px-2 py-1.5 text-[10px] font-semibold text-accent">
                  Rúbrica: +{decimal(points ?? 0)} pts
                </span>
              </div>
              <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 pt-2 sm:gap-5">
                <div className="min-h-[84px] border border-border bg-surface p-3 sm:px-4">
                  <p className="text-[11px] text-text-secondary">
                    Puntaje oficial
                  </p>
                  <p className="mt-1 text-[26px] leading-8 font-semibold text-ink tabular-nums">
                    {decimal(area.score)}{' '}
                    <span className="text-sm font-normal text-text-secondary">
                      / 10
                    </span>
                  </p>
                </div>
                <ArrowRight
                  className="size-4 text-text-secondary"
                  aria-hidden="true"
                />
                <div className="min-h-[84px] border border-accent/50 bg-surface p-3 sm:px-4">
                  <Label
                    htmlFor="simulation-score"
                    className="text-[11px] font-normal text-text-secondary"
                  >
                    Proyección simulada
                  </Label>
                  <div className="mt-1 flex items-baseline gap-1 text-accent">
                    <output
                      id="simulation-score"
                      aria-label="Puntaje proyectado"
                      className="text-[26px] leading-8 font-semibold tabular-nums"
                    >
                      {decimal(result.score)}
                    </output>
                    <span className="shrink-0 text-xs">/ 10</span>
                  </div>
                </div>
              </div>
              <div
                aria-label="Comparación de puntajes"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={10}
                aria-valuenow={result.score}
                className="relative isolate flex h-5 items-center"
              >
                <div className="absolute inset-x-0 h-2 rounded-[2px] bg-border" />
                <div
                  className="absolute left-0 h-2 rounded-[2px] bg-[#d2a21b]"
                  style={{ width: `${result.score * 10}%` }}
                />
                <div
                  className="absolute left-0 h-2 rounded-l-[2px] bg-[#7793a6]"
                  style={{ width: `${area.score * 10}%` }}
                />
              </div>
              <div
                aria-live="polite"
                className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-[11px] leading-4 text-text-secondary"
              >
                <p>
                  Tu puntaje aumentaría{' '}
                  <strong className="text-ink">
                    +{decimal(result.score - area.score)} pts
                  </strong>
                  .{points !== undefined && area.score + points > 10 && (
                    <> Se aplica el límite de 10 puntos por eje.</>
                  )}
                </p>
                <p>
                  Promedio global proyectado:{' '}
                  <strong>{decimal(result.average)} / 10</strong>
                </p>
              </div>
            </section>
            <div className="grid gap-3 min-[360px]:grid-cols-2">
              <div className="border-l-[3px] border-[#7793a6] bg-surface-soft px-[13px] py-4">
                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    Tu información oficial no cambiará
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-text-secondary">
                    Tus habilidades y puntuaciones publicadas se conservan.
                  </p>
                </div>
              </div>
              <div className="border-l-[3px] border-[#7793a6] bg-surface-soft px-[13px] py-4">
                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    Afinidad con vacantes conservada
                  </p>
                  <p className="mt-1 text-[10px] leading-4 text-text-secondary">
                    Esta simulación no afecta tus compatibilidades reales.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-[18px] sm:px-7">
            <p className="text-[11px] leading-4 text-text-secondary">
              La simulación se descartará al cerrar.
            </p>
            <Button
              type="button"
              className="h-11 shrink-0 rounded-sm bg-accent px-5 text-xs text-accent-foreground"
              onClick={onClose}
            >
              Cerrar simulación
            </Button>
          </footer>
        </DialogPopup>
      </DialogPortal>
    </Dialog>
  );
}
