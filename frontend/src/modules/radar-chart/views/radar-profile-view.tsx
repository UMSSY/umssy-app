"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout";
import { AffinityRadarChart } from "../components/affinity-radar-chart";
import { AreaBreakdownPanel } from "../components/area-breakdown-panel";
import type { AreaId } from "../types/area-detail.types";
import { RadarEvidencePanel } from "../components/radar-evidence-panel";
import { RadarSkillSources } from "../components/radar-skill-sources";
import { useLiveRadar } from "../hooks/use-live-radar";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

export function RadarProfileView() {
  const { data, loading, error, variation, previous, retry, retrying } = useLiveRadar();
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [comparing, setComparing] = useState(false);
  const comparison = comparing ? previous : null;
  const areas = data?.areas ?? [];
  const selected = areas.find(area => area.id === selectedArea)
    ?? areas.find(area => comparison && area.score !== comparison.scores[area.id])
    ?? areas[0];
  const previousScore = selected ? comparison?.scores[selected.id] : undefined;
  const delta = selected && previousScore !== undefined ? Number((selected.score - previousScore).toFixed(2)) : 0;

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 font-sans">
      <PageHeading
        title="Radar de afinidad"
        description="Competencias verificadas de tu perfil. Las habilidades pendientes no alteran las puntuaciones publicadas."
      />
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
          <details className="group rounded-lg border border-border bg-surface p-5">
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
          <div aria-label="Resumen del perfil" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.average.toLocaleString("es-BO", { maximumFractionDigits: 2 })} / 10</b><p className="text-xs">Afinidad global</p><p className="text-xs text-text-secondary">{variation === null ? "Variación anterior no disponible" : `${variation >= 0 ? "+" : ""}${variation.toFixed(2)} vs. anterior`}</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{areas.filter((a) => a.score > 0).length} / 6</b><p className="text-xs">Áreas con puntuación</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.keywordCount}</b><p className="text-xs">Habilidades aprobadas</p><p className="text-xs text-text-secondary">{data.highRelevanceCount} de alta relevancia</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.pendingCount}</b><p className="text-xs">Habilidades pendientes</p></div>
          </div>
          {data.version > 0 && data.approved.length === 0 && areas.every(area => area.score === 0) ? (
            <p className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">Todavía no tienes habilidades aprobadas. El radar conserva sus seis ejes en 0/10. <Link href="/profile/documents" className="underline">Completar documentación y CV</Link>.</p>
          ) : null}
          {data.version === 0 ? <p role="status">Aún no tienes publicaciones. Tu radar está sin datos.</p> : !previous ? <p role="status">Tienes una publicación. Podrás compararla cuando se publique la próxima versión de tu radar.</p> : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <AffinityRadarChart
              previousScores={previous?.scores}
              previousPublishedAt={previous?.updatedAt}
              publishedAt={data.updatedAt}
              comparisonEnabled={Boolean(comparison)}
              onComparisonChange={(enabled) => { setComparing(enabled); setSelectedArea(null); }}
              areas={data.version === 0 ? [] : areas}
              average={data.average}
              onAreaClick={setSelectedArea}
            />
            <AreaBreakdownPanel areas={areas} average={data.average} />
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
          {selectedArea && !comparison ? (
            <RadarEvidencePanel key={`${data.userId}:${selectedArea}`} selected={selectedArea} radar={data} onClose={() => setSelectedArea(null)} />
          ) : null}
          <p className="text-xs text-text-secondary">Las puntuaciones reflejan las habilidades aprobadas y sus evidencias.</p>
        </>
      ) : (!loading && !error ? <p className="text-text-secondary">Sin respuesta del servicio de afinidad.</p> : null)}
    </main>
  );
}
