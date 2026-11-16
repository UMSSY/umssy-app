"use client";

import { MentorshipProjection } from "../components/mentorship-projection";
import { useEffect, useRef, useState } from "react";
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
import { mapPublishedRadar } from "../mappers/radar-published.mapper";
import type { IntegrationRadar } from "../types/integration-radar.types";
import {
  useRadarNotifications,
  useRadarNotificationMutations,
} from "../hooks/use-radar-integration-queries";

const DATE_FORMAT: Intl.DateTimeFormatOptions = { dateStyle: "medium", timeStyle: "short" };

export function RadarProfileView() {
  const { data, loading, error, variation, previous, retry, retrying } = useLiveRadar();
  const { data: notifications = [], isLoading: notificationsLoading } =
    useRadarNotifications();
  const { openNotification } = useRadarNotificationMutations();

  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [projection, setProjection] = useState<{ areaId: AreaId; score: number } | null>(null);
  const [simulationOpen, setSimulationOpen] = useState(false);
  const [showEvidence, setShowEvidence] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [openedRadar, setOpenedRadar] = useState<IntegrationRadar | null>(null);
  const selectedPanelRef = useRef<HTMLElement>(null);

  const handleOpenNotification = async (id: string) => {
    try {
      const result = await openNotification.mutateAsync(id);
      setOpenedRadar(result.radar);
      setComparing(result.compare);
      setSelectedArea(null);
    } catch {
      // React Query conserva el error de la mutación.
    }
  };
  const displayedData = openedRadar ? mapPublishedRadar(openedRadar) : data;
  const displayPrevious = openedRadar ? openedRadar.previous : previous;
  const displayVariation = openedRadar ? openedRadar.variation : variation;
  const comparison = comparing ? displayPrevious : null;
  const areas = displayedData?.areas ?? [];

  useEffect(() => {
    if (!selectedArea) return;

    const dismissOutside = (event: PointerEvent) => {
      if (simulationOpen || showEvidence) return;
      if (
        event.target instanceof Node &&
        !selectedPanelRef.current?.contains(event.target)
      ) {
        setSelectedArea(null);
      }
    };

    const dismissWithEscape = (event: KeyboardEvent) => {
      if (simulationOpen || showEvidence) return;
      if (event.key === "Escape") {
        setSelectedArea(null);
      }
    };

    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("keydown", dismissWithEscape);

    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("keydown", dismissWithEscape);
    };
  }, [selectedArea, simulationOpen, showEvidence]);

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
      <section
        aria-label="Notificaciones del radar"
        className="rounded-lg border border-border bg-surface p-5"
      >
        <h2 className="text-lg font-semibold text-ink">
          Notificaciones
        </h2>

        {notificationsLoading ? (
          <p role="status" className="mt-3 text-sm text-text-secondary">
            Cargando notificaciones...
          </p>
        ) : notifications.length === 0 ? (
          <p className="mt-3 text-sm text-text-secondary">
            No tienes notificaciones todavía.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {notifications.map((notification) => (
              <li
                key={notification.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border p-3"
              >
                <div>
                  <p className="font-medium text-ink">
                    {notification.message}
                  </p>
                  <p className="text-xs text-text-secondary">
                    Versión {notification.version} ·{" "}
                    {new Date(notification.createdAt).toLocaleString(
                      "es-BO",
                      DATE_FORMAT,
                    )}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {notification.readAt ? "Leída" : "Sin leer"}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  disabled={openNotification.isPending}
                  onClick={() => {
                    void handleOpenNotification(notification.id);
                  }}
                >
                  Abrir radar
                </Button>
              </li>
            ))}
          </ul>
        )}
        {openNotification.isError && (
          <p role="alert" className="mt-3 text-sm text-red-600">
            No se pudo abrir el radar. Comprueba tu conexión e inténtalo nuevamente.
          </p>
        )}
      </section>
      {openedRadar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p role="status" className="text-sm font-medium text-ink">
            Consultando la versión histórica {openedRadar.version}
          </p>
          <Button type="button" variant="outline" onClick={() => {
            setOpenedRadar(null);
            setComparing(false);
            setSelectedArea(null);
          }}>
            Volver al radar actual
          </Button>
        </div>
      ) : null}      {loading && !data ? <p role="status" className="rounded-lg border border-border bg-surface p-5">Cargando tu radar...</p> : null}
      {error ? (
        <div role="alert" className="rounded-lg border border-border bg-surface p-5">
          <p>{error}</p>
          <Button type="button" variant="outline" className="mt-2" disabled={retrying} onClick={() => { void retry(); }}>{retrying ? 'Actualizando...' : 'Reintentar'}</Button>
          {data ? <p className="mt-2 text-xs text-text-secondary">Se conserva la última instantánea disponible.</p> : null}
        </div>
      ) : null}
      {displayedData ? (
        <>
          <details className="group rounded-lg border border-border bg-surface p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-semibold text-ink">Mi perfil profesional</h2>
                <p className="text-xs text-text-secondary">Competencias y evidencias de tu perfil</p>
              </div>
              <div className="ml-auto text-right text-xs text-text-secondary">
                <p role="status" className="font-semibold text-ink">{displayedData.status === "ready" ? (displayedData.approved.length ? "Publicado" : "Sin evidencias aprobadas") : displayedData.status === "pending" ? (displayedData.processingStatus === "pending" ? "Actualización en curso" : "Pendiente de revisión") : "Análisis con error"}</p>
                <p>Última actualización: {displayedData.updatedAt ? new Date(displayedData.updatedAt).toLocaleString("es-BO", DATE_FORMAT) : "Sin actualización"}</p>
              </div>
              <ChevronDown aria-hidden="true" className="size-5 shrink-0 text-text-secondary transition-transform group-open:rotate-180" />
            </summary>
            <RadarSkillSources userId={displayedData.userId} skills={displayedData.approved} />
          </details>
          <div aria-label="Resumen del perfil" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{displayedData.average.toLocaleString("es-BO", { maximumFractionDigits: 2 })} / 10</b><p className="text-xs">Afinidad global</p><p className="text-xs text-text-secondary">{displayVariation === null ? "Variación anterior no disponible" : `${displayVariation >= 0 ? "+" : ""}${displayVariation.toFixed(2)} vs. anterior`}</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{areas.filter((a) => a.score > 0).length} / 6</b><p className="text-xs">Áreas con puntuación</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{displayedData.keywordCount}</b><p className="text-xs">Habilidades aprobadas</p><p className="text-xs text-text-secondary">{displayedData.highRelevanceCount} de alta relevancia</p></div>
            <div className="rounded-lg border border-border bg-surface p-5"><b className="text-2xl">{displayedData.pendingCount}</b><p className="text-xs">Habilidades pendientes</p></div>
          </div>
          {displayedData.version > 0 && displayedData.approved.length === 0 && areas.every(area => area.score === 0) ? (
            <p className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">Todavía no tienes habilidades aprobadas. El radar conserva sus seis ejes en 0/10. <Link href="/profile/documents" className="underline">Completar documentación y CV</Link>.</p>
          ) : null}
          {displayedData.version === 0 ? <p role="status">Aún no tienes publicaciones. Tu radar está sin datos.</p> : !displayPrevious ? <p role="status">Tienes una publicación. Podrás compararla cuando se publique la próxima versión de tu radar.</p> : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
            <AffinityRadarChart
              projectedScores={projection ? { [projection.areaId]: projection.score } : undefined}
              previousScores={displayPrevious?.scores}
              previousPublishedAt={displayPrevious?.updatedAt}
              publishedAt={displayedData.updatedAt}
              comparisonEnabled={Boolean(comparison)}
              onComparisonChange={(enabled) => { setComparing(enabled); setSelectedArea(null); }}
              areas={displayedData.version === 0 ? [] : areas}
              average={displayedData.average}
              onAreaClick={setSelectedArea}
            />
            <div ref={selectedPanelRef} className="flex flex-col gap-4">
              {selectedArea && !comparison && areas.find(area => area.id === selectedArea) ? (
                <section
                  aria-label={`Área seleccionada: ${areas.find(area => area.id === selectedArea)!.name}`}
                  className="rounded-lg border border-border bg-surface p-4"
                >
                  <h2 className="text-base font-semibold text-ink">
                    {areas.find(area => area.id === selectedArea)!.name}
                  </h2>
                  <p className="mt-1 text-sm text-text-secondary">
                    Explora oportunidades de mentoría y la evidencia de esta área.
                  </p>
                  <Link
                    href={`/mentorship/mentors?area=${selectedArea.toUpperCase()}&from=radar`}
                    className="mt-3 block text-sm font-medium text-accent underline underline-offset-4"
                  >
                    Ver mentores de esta área
                  </Link>
                  <div className="mt-3">
                    <MentorshipProjection
                      area={areas.find(area => area.id === selectedArea)!}
                      areas={areas}
                      onProjectionChange={setProjection}
                      onOpenChange={setSimulationOpen}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-full"
                    onClick={() => setShowEvidence(true)}
                  >
                    Ver evidencias
                  </Button>
                </section>
              ) : null}
              <AreaBreakdownPanel
                areas={areas}
                average={displayedData.average}
                compact
                selectedArea={selectedArea}
                onAreaClick={setSelectedArea}
              />
            </div>
          </div>
          {comparison ? (
            <section aria-label="Comparación de publicaciones" className="rounded-lg border border-border bg-surface p-4">
              <h2 className="text-sm font-semibold text-ink">Detalle de los cambios</h2>
              {displayedData.processingStatus === "pending" ? <p role="status">Hay un recálculo pendiente. Se comparan las dos últimas publicaciones disponibles.</p> : null}
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
          {showEvidence && selectedArea && !comparison ? (
            <RadarEvidencePanel
              key={`${displayedData.userId}:${selectedArea}`}
              selected={selectedArea}
              radar={displayedData}
              onClose={() => setShowEvidence(false)}
            />
          ) : null}
          <p className="text-xs text-text-secondary">Las puntuaciones reflejan las habilidades aprobadas y sus evidencias.</p>
        </>
      ) : (!loading && !error ? <p className="text-text-secondary">Sin respuesta del servicio de afinidad.</p> : null)}
    </main>
  );
}