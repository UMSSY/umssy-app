"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AffinityRadarChart } from "../components/affinity-radar-chart";
import { AreaBreakdownPanel } from "../components/area-breakdown-panel";
import type { AreaId } from "../types/area-detail.types";
import { RadarEvidencePanel } from "../components/radar-evidence-panel";
import { RadarSkillSources } from "../components/radar-skill-sources";
import { useLiveRadar } from "../hooks/use-live-radar";
import { RadarAreaActions } from "../components/radar-area-actions";
import { SkillSimulationDialog } from "../components/skill-simulation-dialog";
import { skillsService } from "@/modules/skills/services/skills.service";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

export function RadarProfileView() {
  const { data, loading, error, variation, previous, retry, retrying } = useLiveRadar();
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [evidenceArea, setEvidenceArea] = useState<AreaId | null>(null);
  const [comparing, setComparing] = useState(false);
  const [simulationArea, setSimulationArea] = useState<AreaId | null>(null);
  const simulationCatalog = useQuery({
    queryKey: ["radar-simulation-catalog", data?.userId],
    queryFn: skillsService.getCatalog,
    enabled: simulationArea !== null,
    staleTime: 5 * 60 * 1000,
  });
  const comparison = comparing ? previous : null;
  const areas = data?.areas ?? [];
  const selected = areas.find(area => area.id === selectedArea)
    ?? areas.find(area => comparison && area.score !== comparison.scores[area.id])
    ?? areas[0];
  const previousScore = selected ? comparison?.scores[selected.id] : undefined;
  const delta = selected && previousScore !== undefined ? Number((selected.score - previousScore).toFixed(2)) : 0;

  return (
    <main className="mx-auto flex w-full max-w-[1344px] flex-col gap-6 font-sans lg:-mt-7">
      <header className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div className="max-w-2xl">
          <h1 className="[font-family:Georgia,serif] text-[32px] leading-tight font-semibold tracking-tight text-accent">Radar de afinidad</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">Conoce tus fortalezas y encuentra orientación para seguir creciendo.</p>
        </div>
        {data ? <div className="flex shrink-0 flex-col sm:text-right">
          <p className="text-[10px] tracking-widest text-text-secondary uppercase">Promedio oficial</p>
          <p className="-order-1 text-4xl leading-tight font-bold text-accent tabular-nums">{data.average.toLocaleString("es-BO", { maximumFractionDigits: 2 })}</p>
          {variation !== null ? <p className="mt-1 text-xs text-text-secondary">{variation >= 0 ? "+" : ""}{variation.toFixed(2)} vs. anterior</p> : null}
        </div> : null}
      </header>
      {loading && !data ? <p role="status" className="rounded-lg border border-border bg-surface p-5">Cargando tu radar...</p> : null}
      {error ? (
        <div role="alert" className="rounded-lg border border-border bg-surface p-5">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-2" disabled={retrying} onClick={() => { void retry(); }}>{retrying ? 'Actualizando...' : 'Reintentar'}</Button>
          {data ? <p className="mt-2 text-xs text-text-secondary">Se conserva la última instantánea disponible.</p> : null}
        </div>
      ) : null}
      {data ? (
        <>
          <details className="group order-10 rounded-xl border border-border bg-surface p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-semibold text-ink">Mi perfil profesional</h2>
                <p className="text-xs text-text-secondary">Competencias y evidencias de tu perfil</p>
              </div>
              <div className="ml-auto text-right text-xs text-text-secondary">
                <p role="status" className="font-semibold text-ink">{data.status === "ready" ? (data.approved.length ? "Publicado" : "Sin evidencias aprobadas") : data.status === "pending" ? (data.processingStatus === "pending" ? "Actualización en curso" : "Pendiente de revisión") : "Análisis con error"}</p>
                <p>Última actualización: {data.updatedAt ? new Date(data.updatedAt).toLocaleString("es-BO", DATE_FORMAT) : "Sin actualización"}</p>
              </div>
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
            </summary>
            <RadarSkillSources userId={data.userId} skills={data.approved} />
          </details>
          {data.version > 0 && data.approved.length === 0 && areas.every(area => area.score === 0) ? (
            <p className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">Todavía no tienes habilidades aprobadas. El radar conserva sus seis ejes en 0/10. <Link href="/profile/documents" className="underline">Completar documentación y CV</Link>.</p>
          ) : null}
          {data.version === 0 ? <p role="status">Aún no tienes publicaciones. Tu radar está sin datos.</p> : !previous ? <p role="status">Tienes una publicación. Podrás compararla cuando se publique la próxima versión de tu radar.</p> : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.06fr)_minmax(300px,1fr)]">
            <AffinityRadarChart
              previousScores={previous?.scores}
              previousPublishedAt={previous?.updatedAt}
              publishedAt={data.updatedAt}
              comparisonEnabled={Boolean(comparison)}
              onComparisonChange={(enabled) => { setComparing(enabled); setSelectedArea(null); setEvidenceArea(null); }}
              areas={data.version === 0 ? [] : areas}
              className="min-w-0 rounded-none shadow-none"
              plotClassName="h-[340px] sm:h-[436px]"
              onAreaClick={area => { setSelectedArea(area); if (!comparison) setEvidenceArea(area); }}
            />
            <div className="flex min-w-0 flex-col gap-4">
              {selected ? <RadarAreaActions area={selected} onSimulate={() => setSimulationArea(selected.id)} /> : null}
              <AreaBreakdownPanel areas={areas} average={data.average} selectedArea={selected?.id} onAreaClick={setSelectedArea} className="rounded-none p-6 shadow-none" />
            </div>
          </div>
          {comparison ? (
            <section aria-label="Comparación de publicaciones" className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">Detalle de los cambios</h2>
              {data.processingStatus === "pending" ? <p role="status">Hay un recálculo pendiente. Se comparan las dos últimas publicaciones disponibles.</p> : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map(area => <Button key={area.id} type="button" size="sm" variant="outline" aria-pressed={selected?.id === area.id} onClick={() => setSelectedArea(area.id)}>{area.name}</Button>)}
              </div>
              {selected ? <div aria-label={`Cambio en ${selected.name}`} className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
                <b className="text-ink">{selected.name}</b>
                <span>Puntaje anterior: {previousScore?.toLocaleString("es-BO")} / 10</span>
                <span>Puntaje actual: {selected.score.toLocaleString("es-BO")} / 10</span>
                <span className="font-semibold">{delta === 0 ? "Sin cambio" : `${delta > 0 ? "Subió" : "Bajó"} ${Math.abs(delta).toLocaleString("es-BO")} puntos`}</span>
              </div> : null}
            </section>
          ) : null}
          {evidenceArea && !comparison && !simulationArea ? (
            <RadarEvidencePanel key={`${data.userId}:${evidenceArea}`} selected={evidenceArea} radar={data} onClose={() => setEvidenceArea(null)} actions={selected ? <RadarAreaActions area={selected} onSimulate={() => { setEvidenceArea(null); setSimulationArea(selected.id); }} /> : null} />
          ) : null}
          {simulationArea ? <SkillSimulationDialog key={simulationArea} areas={areas} initialArea={simulationArea} catalog={simulationCatalog.data} approved={data.approved} onClose={() => setSimulationArea(null)} /> : null}
          <p className="text-xs text-text-secondary">Las puntuaciones reflejan las habilidades aprobadas y sus evidencias.</p>
        </>
      ) : (!loading && !error ? <p className="text-text-secondary">Sin respuesta del servicio de afinidad.</p> : null)}
    </main>
  );
}
