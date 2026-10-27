"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeading } from "@/shared/components/layout";
import { AffinityRadarChart } from "../components/affinity-radar-chart";
import { AreaBreakdownPanel } from "../components/area-breakdown-panel";
import type { AreaId } from "../types/area-detail.types";
import { RadarEvidencePanel } from "../sprint2/radar-evidence-panel";
import { useLiveRadar } from "../sprint2/use-live-radar";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

export function RadarProfileView() {
  const { data, loading, error, variation, retry, retrying } = useLiveRadar();
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const areas = data?.areas ?? [];

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
          <div className="rounded-lg border border-border bg-surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-ink">Mi perfil profesional</h2>
                <p className="text-xs text-text-secondary">Competencias y evidencias de tu perfil</p>
              </div>
              <div className="text-right text-xs text-text-secondary">
                <p role="status" className="font-semibold text-ink">{data.status === "ready" ? (data.approved.length ? "Publicado" : "Sin evidencias aprobadas") : data.status === "pending" ? (data.processingStatus === "pending" ? "Actualización en curso" : "Pendiente de revisión") : "Análisis con error"}</p>
                <p>Versión del radar {data.version} · Rúbrica {data.rubric}</p>
                <p>Última actualización: {data.updatedAt ? new Date(data.updatedAt).toLocaleString("es-BO", DATE_FORMAT) : "Sin actualización"}</p>
              </div>
            </div>
          </div>
          <div aria-label="Resumen del perfil" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.average.toLocaleString("es-BO", { maximumFractionDigits: 2 })} / 10</b><p className="text-xs">Afinidad global</p><p className="text-xs text-text-secondary">{variation === null ? "Variación anterior no disponible" : `${variation >= 0 ? "+" : ""}${variation.toFixed(2)} vs. anterior`}</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{areas.filter((a) => a.score > 0).length} / 6</b><p className="text-xs">Áreas con puntuación</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.keywordCount}</b><p className="text-xs">Habilidades aprobadas</p><p className="text-xs text-text-secondary">{data.highRelevanceCount} de alta relevancia</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{data.pendingCount}</b><p className="text-xs">Habilidades pendientes</p></div>
          </div>
          {data.approved.length === 0 && areas.every(area => area.score === 0) ? (
            <p className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">Todavía no tienes habilidades aprobadas. El radar conserva sus seis ejes en 0/10. <Link href="/profile/documents" className="underline">Completar documentación y CV</Link>.</p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <AffinityRadarChart areas={areas} average={data.average} onAreaClick={setSelectedArea} />
            <AreaBreakdownPanel areas={areas} average={data.average} />
          </div>
          {selectedArea ? (
            <RadarEvidencePanel key={`${data.userId}:${selectedArea}`} selected={selectedArea} radar={data} onClose={() => setSelectedArea(null)} />
          ) : null}
          <p className="text-xs text-text-secondary">Cálculo provisional para integración: 1 punto por habilidad aprobada y 0,5 adicional por alta relevancia, máximo 10 por área. Pendiente de aprobación del Product Owner.</p>
        </>
      ) : (!loading && !error ? <p className="text-text-secondary">Sin respuesta del servicio de afinidad.</p> : null)}
    </main>
  );
}
