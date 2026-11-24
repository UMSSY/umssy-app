'use client';

import { useSearchParams } from 'next/navigation';
import { MentorshipAvailability } from '../components/mentorship-projection';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSkillCatalog } from '@/modules/skills';
import { useRadarSimulationEligibility } from '../hooks/use-radar-simulation-eligibility';
import { RadarAreaActions } from '../components/radar-area-actions';
import { SkillSimulationDialog } from '../components/skill-simulation-dialog';
import { cn } from '@/lib/utils';
import {
  readSessionStorage,
  writeSessionStorage,
} from '@/shared/services/storage/browser-session-storage';
import { AffinityRadarChart } from '../components/affinity-radar-chart';
import { AreaBreakdownPanel } from '../components/area-breakdown-panel';
import type { AreaId } from '../types/area-id.types';
import { RadarEvidencePanel } from '../components/radar-evidence-panel';
import { RadarSkillSources } from '../components/radar-skill-sources';
import { useLiveRadar } from '../hooks/use-live-radar';
import { useMobileViewport } from '../hooks/use-mobile-viewport';
import { mapPublishedRadar } from '../mappers/radar-published.mapper';
import type { IntegrationRadar } from '../types/integration-radar.types';
import { useHistoricalRadar } from '../hooks/use-historical-radar';

const DATE_FORMAT: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
};

export function RadarProfileView() {
  const isMobile = useMobileViewport();
  const {
    data: liveData,
    loading,
    error,
    variation: liveVariation,
    previous: livePrevious,
    retry,
    retrying,
  } = useLiveRadar();
  const searchParams = useSearchParams();
  const [dismissedSnapshot, setDismissedSnapshot] = useState<string | null>(
    null,
  );
  const requestedSnapshot = searchParams.get('snapshot');
  const snapshotId =
    requestedSnapshot === dismissedSnapshot ? null : requestedSnapshot;
  const historical = useHistoricalRadar(snapshotId);
  const openedRadar: IntegrationRadar | null = snapshotId
    ? (historical.data ?? null)
    : null;
  const data = openedRadar ? mapPublishedRadar(openedRadar) : liveData;
  const previous = openedRadar ? openedRadar.previous : livePrevious;
  const variation = openedRadar ? openedRadar.variation : liveVariation;
  const [selectedArea, setSelectedArea] = useState<AreaId | null>(null);
  const [projection, setProjection] = useState<{
    areaId: AreaId;
    score: number;
  } | null>(null);
  const [simulationArea, setSimulationArea] = useState<AreaId | null>(null);
  const simulationCatalog = useSkillCatalog(simulationArea !== null);
  const [showMentorship, setShowMentorship] = useState(false);
  const simulationEligibility = useRadarSimulationEligibility(
    data?.userId,
    simulationArea !== null,
  );
  const simulationLoading =
    simulationEligibility.isFetching || simulationCatalog.isFetching;
  const simulationError =
    simulationEligibility.isError || simulationCatalog.isError ||
    simulationEligibility.isPaused || simulationCatalog.isPaused;
  const simulationReady = !simulationLoading && !simulationError &&
    simulationEligibility.isSuccess && simulationCatalog.isSuccess;
  const closeSimulation = () => {
    setProjection(null);
    setSimulationArea(null);
    setShowMentorship(false);
  };
  const [isEvidenceVisible, setIsEvidenceVisible] = useState(false);
  const [comparisonPreference, setComparisonPreference] = useState<{
    key: string;
    enabled: boolean;
  } | null>(null);
  const comparisonKey = data ? `radar:comparison:${data.userId}` : null;
  const isComparing = comparisonKey
    ? comparisonPreference?.key === comparisonKey
      ? comparisonPreference.enabled
      : readSessionStorage(comparisonKey) === 'true'
    : false;
  const selectedPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!selectedArea || isEvidenceVisible || simulationArea) return;
    const dismissOutside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !selectedPanelRef.current?.contains(event.target)
      ) {
        setSelectedArea(null);
      }
    };
    const dismissWithEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedArea(null);
    };
    document.addEventListener('pointerdown', dismissOutside);
    document.addEventListener('keydown', dismissWithEscape);
    return () => {
      document.removeEventListener('pointerdown', dismissOutside);
      document.removeEventListener('keydown', dismissWithEscape);
    };
  }, [selectedArea, isEvidenceVisible, simulationArea]);

  const handleSelectArea = (id: AreaId) => {
    setSelectedArea(id);
    setIsEvidenceVisible(isMobile);
  };

  const comparison = isComparing ? previous : null;
  const areas = data?.areas ?? [];
  const selected =
    areas.find((area) => area.id === selectedArea) ??
    areas.find(
      (area) => comparison && area.score !== comparison.scores[area.id],
    ) ??
    areas[0];
  const previousScore = selected ? comparison?.scores[selected.id] : undefined;
  const delta =
    selected && previousScore !== undefined
      ? Number((selected.score - previousScore).toFixed(2))
      : 0;

  return (
    <main className="mx-auto flex w-full max-w-[1344px] flex-col gap-6 font-sans">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="[font-family:Georgia,serif] text-[32px] font-semibold text-accent">Radar de afinidad</h1>
          <p className="mt-3 text-sm text-text-secondary">Conoce tus fortalezas y encuentra orientación para seguir creciendo.</p>
        </div>
        {data && (
          <div className="text-accent sm:text-right">
            <p className="text-4xl font-bold tabular-nums">{data.average.toLocaleString('es-BO', { maximumFractionDigits: 2 })}</p>
            <p className="text-xs uppercase">Promedio oficial</p>
          </div>
        )}
      </header>
      {snapshotId && historical.isPending ? (
        <p role="status">Cargando publicacion...</p>
      ) : null}
      {snapshotId && historical.isError ? (
        <p role="alert" className="text-destructive">
          No se pudo abrir la publicacion solicitada.
        </p>
      ) : null}
      {openedRadar ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-surface p-4">
          <p role="status" className="text-sm font-medium text-ink">
            Consultando la versión histórica {openedRadar.version}
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDismissedSnapshot(snapshotId);
              window.history.replaceState(null, '', window.location.pathname);
              setSelectedArea(null);
            }}
          >
            Volver al radar actual
          </Button>
        </div>
      ) : null}
      {loading && !data ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-surface p-5"
        >
          Cargando tu radar...
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="rounded-lg border border-border bg-surface p-5"
        >
          <p>{error}</p>
          <Button
            type="button"
            variant="outline"
            className="mt-2"
            disabled={retrying}
            onClick={() => {
              void retry();
            }}
          >
            {retrying ? 'Actualizando...' : 'Reintentar'}
          </Button>
          {data ? (
            <p className="mt-2 text-xs text-text-secondary">
              Se conserva la última instantánea disponible.
            </p>
          ) : null}
        </div>
      ) : null}
      {data ? (
        <>
          <details className="group order-10 rounded-xl border border-border bg-surface p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-4 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent [&::-webkit-details-marker]:hidden">
              <div>
                <h2 className="text-lg font-semibold text-ink">
                  Mi perfil profesional
                </h2>
                <p className="text-xs text-text-secondary">
                  Competencias y evidencias de tu perfil
                </p>
              </div>
              <div className="ml-auto text-right text-xs text-text-secondary">
                <p role="status" className="font-semibold text-ink">
                  {data.status === 'ready'
                    ? data.approved.length
                      ? 'Publicado'
                      : 'Sin evidencias aprobadas'
                    : data.status === 'pending'
                      ? data.processingStatus === 'pending'
                        ? 'Actualización en curso'
                        : 'Pendiente de revisión'
                      : 'Análisis con error'}
                </p>
                <p>
                  Última actualización:{' '}
                  {data.updatedAt
                    ? new Date(data.updatedAt).toLocaleString(
                        'es-BO',
                        DATE_FORMAT,
                      )
                    : 'Sin actualización'}
                </p>
              </div>
              <ChevronDown
                aria-hidden="true"
                className="size-5 shrink-0 text-text-secondary transition-transform group-open:rotate-180"
              />
            </summary>
            <RadarSkillSources userId={data.userId} skills={data.approved} />
          </details>
          <div
            aria-label="Resumen del perfil"
            className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            <div className="rounded-lg border border-border bg-surface p-5">
              <b className="text-2xl">
                {data.average.toLocaleString('es-BO', {
                  maximumFractionDigits: 2,
                })}{' '}
                / 10
              </b>
              <p className="text-xs">Afinidad global</p>
              <p className="text-xs text-text-secondary">
                {variation === null
                  ? 'Variación anterior no disponible'
                  : `${variation >= 0 ? '+' : ''}${variation.toFixed(2)} vs. anterior`}
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <b className="text-2xl">
                {areas.filter((a) => a.score > 0).length} / 6
              </b>
              <p className="text-xs">Áreas con puntuación</p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <b className="text-2xl">{data.keywordCount}</b>
              <p className="text-xs">Habilidades aprobadas</p>
              <p className="text-xs text-text-secondary">
                {data.highRelevanceCount} de alta relevancia
              </p>
            </div>
            <div className="rounded-lg border border-border bg-surface p-5">
              <b className="text-2xl">{data.pendingCount}</b>
              <p className="text-xs">Habilidades pendientes</p>
            </div>
          </div>
          {data.version > 0 &&
          data.approved.length === 0 &&
          areas.every((area) => area.score === 0) ? (
            <p className="rounded-lg border border-border bg-surface-soft p-4 text-sm text-text-secondary">
              Todavía no tienes habilidades aprobadas. El radar conserva sus
              seis ejes en 0/10.{' '}
              <Link href="/profile/documents" className="underline">
                Completar documentación y CV
              </Link>
              .
            </p>
          ) : null}
          {data.version === 0 ? (
            <p role="status">
              Aún no tienes publicaciones. Tu radar está sin datos.
            </p>
          ) : !previous ? (
            <p role="status">
              Tienes una publicación. Podrás compararla cuando se publique la
              próxima versión de tu radar.
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.06fr)_minmax(300px,1fr)]">
            <AffinityRadarChart
              projectedScores={
                simulationArea && projection
                  ? { [projection.areaId]: projection.score }
                  : undefined
              }
              previousScores={previous?.scores}
              previousPublishedAt={previous?.updatedAt}
              publishedAt={data.updatedAt}
              isComparisonEnabled={Boolean(comparison)}
              highlightedArea={comparison ? selected?.id : undefined}
              onComparisonChange={(enabled) => {
                if (!comparisonKey) return;
                writeSessionStorage(comparisonKey, String(enabled));
                setComparisonPreference({ key: comparisonKey, enabled });
                setSelectedArea(null);
                setIsEvidenceVisible(false);
              }}
              areas={data.version === 0 ? [] : areas}
              className="min-w-0 rounded-none shadow-none"
              plotClassName="h-[340px] sm:h-[436px]"
              onAreaClick={(id) => {
                setSelectedArea(id);
                setIsEvidenceVisible(!comparison);
              }}
            />
            <div ref={selectedPanelRef} className="flex min-w-0 flex-col gap-4">
              {selected && !comparison ? (
                <section
                  aria-label="Área seleccionada"
                  className="space-y-3"
                >
                  <RadarAreaActions area={selected} onSimulate={() => setSimulationArea(selected.id)} />
                  {selectedArea && (
                    <Button className="w-full" onClick={() => {
                      setShowMentorship(true);
                      setSimulationArea(selected.id);
                    }}>
                      Proyección con mentoría
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSelectedArea(selected.id);
                      setIsEvidenceVisible(true);
                    }}
                  >
                    Ver evidencias
                  </Button>
                </section>
              ) : null}
              <AreaBreakdownPanel
                className="rounded-none shadow-none"
                areas={areas}
                average={data.average}
                compact={Boolean(selectedArea) && !isMobile}
                selectedArea={selectedArea}
                onAreaClick={handleSelectArea}
              />
            </div>
          </div>
          {comparison ? (
            <section
              aria-label="Comparación de publicaciones"
              className="rounded-lg border border-border bg-surface p-4"
            >
              <h2 className="text-sm font-semibold text-ink">
                Detalle de los cambios
              </h2>
              {data.processingStatus === 'pending' ? (
                <p role="status">
                  Hay un recálculo pendiente. Se comparan las dos últimas
                  publicaciones disponibles.
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {areas.map((area) => (
                  <Button
                    key={area.id}
                    type="button"
                    size="sm"
                    variant="outline"
                    aria-pressed={selected?.id === area.id}
                    onClick={() => setSelectedArea(area.id)}
                  >
                    {area.name}
                  </Button>
                ))}
              </div>
              {selected ? (
                <div
                  aria-label={`Cambio en ${selected.name}`}
                  className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm"
                >
                  <b className="text-ink">{selected.name}</b>
                  <span>
                    Puntaje anterior: {previousScore?.toLocaleString('es-BO')} /
                    10
                  </span>
                  <span>
                    Puntaje actual: {selected.score.toLocaleString('es-BO')} /
                    10
                  </span>
                  <span
                    className={cn(
                      'font-semibold',
                      delta > 0 && 'text-success',
                      delta < 0 && 'text-destructive',
                    )}
                  >
                    {delta === 0
                      ? 'Sin cambio'
                      : `${delta > 0 ? 'Subió' : 'Bajó'} ${Math.abs(delta).toLocaleString('es-BO')} puntos`}
                  </span>
                </div>
              ) : null}
            </section>
          ) : null}
          {selectedArea && isEvidenceVisible && !comparison && !simulationArea ? (
            <RadarEvidencePanel
              key={`${data.userId}:${selectedArea}`}
              selected={selectedArea}
              radar={data}
              onClose={() => setIsEvidenceVisible(false)}
              actions={selected ? <RadarAreaActions area={selected} onSimulate={() => { setIsEvidenceVisible(false); setSimulationArea(selected.id); }} /> : null}
            />
          ) : null}
          {simulationArea && (
            <SkillSimulationDialog
              key={simulationArea}
              areas={areas}
              initialArea={simulationArea}
              catalog={simulationCatalog.data}
              approved={data.approved}
              verification={simulationReady ? simulationEligibility.data : undefined}
              verificationError={!simulationLoading && simulationError}
              onRetry={() => {
                void simulationEligibility.refetch();
                void simulationCatalog.refetch();
              }}
              onProjectionChange={setProjection}
              availability={showMentorship && selected ? <MentorshipAvailability area={selected} /> : null}
              onClose={closeSimulation}
            />
          )}
          <p className="text-xs text-text-secondary">
            Las puntuaciones reflejan las habilidades aprobadas y sus
            evidencias.
          </p>
        </>
      ) : !loading && !error ? (
        <p className="text-text-secondary">
          Sin respuesta del servicio de afinidad.
        </p>
      ) : null}
    </main>
  );
}
