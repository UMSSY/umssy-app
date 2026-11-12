"use client";

import { MAX_SCORE } from "@/modules/radar-chart/constants/radar-score.constants";

import { useId, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import type { AffinityRadarChartProps } from "../types/radar-profile-components.types";
import { formatDecimal } from "../utils/format-decimal";
import { AffinityRadarAxisTick } from "./affinity-radar-axis-tick";
import { AffinityRadarDot } from "./affinity-radar-dot";
import { RadarCard } from "./radar-card";

const LEVEL_TICK_COUNT = 6;
const SERIES_LABEL = "Puntaje de afinidad del perfil";

export function AffinityRadarChart({
  areas,
  previousScores,
  comparisonEnabled = false,
  onComparisonChange,
  previousPublishedAt,
  publishedAt,
  average,
  onAreaClick,
  className,
}: AffinityRadarChartProps) {
  const titleId = useId();
  const comparisonId = useId();
  const comparisonDescriptionId = useId();
  const showPrevious = comparisonEnabled && Boolean(previousScores);
  const formatDate = (date: string) => new Date(date).toLocaleString("es-BO", { dateStyle: "medium", timeStyle: "short" });
  const [radius, setRadius] = useState('68%');
  const hasAreas = areas.length > 0;

  return (
    <RadarCard aria-labelledby={titleId} className={cn("flex flex-col p-4 sm:p-6", className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 id={titleId} className="font-heading text-lg font-semibold tracking-tight text-ink">
            Desglose vectorial de afinidad
          </h2>
          <p className="mt-1 text-xs text-text-secondary">
            {areas.length} áreas de competencias verificadas
          </p>
        </div>
        {hasAreas && average !== undefined && (
          <div className="shrink-0 text-right">
            <p className="font-heading text-3xl leading-none font-semibold text-accent tabular-nums">
              {formatDecimal(average, 2)}
            </p>
            <p className="mt-1 text-xs font-semibold tracking-[0.12em] text-text-secondary uppercase">
              Promedio
            </p>
          </div>
        )}
      </div>

      {hasAreas && previousScores && onComparisonChange ? (
        <div className="mt-4 flex items-center justify-between gap-4 rounded-lg border border-border bg-surface-soft px-4 py-3">
          <div>
            <label htmlFor={comparisonId} className="cursor-pointer text-sm font-semibold text-ink">Comparar con la anterior</label>
            <p id={comparisonDescriptionId} className="mt-1 text-xs text-text-secondary">
              {previousPublishedAt ? `Superpone tu publicación del ${formatDate(previousPublishedAt)}` : "Superpone tu publicación anterior"}
            </p>
          </div>
          <Switch id={comparisonId} aria-describedby={comparisonDescriptionId} checked={comparisonEnabled} onCheckedChange={onComparisonChange} className="data-checked:bg-accent" />
        </div>
      ) : null}

      {hasAreas ? (
        <>
          <div className="mt-2 h-[360px] w-full sm:h-[440px] [&_.recharts-surface]:outline-none">
            <ResponsiveContainer width="100%" height="100%" onResize={width => setRadius(width < 280 ? '30%' : width < 360 ? '50%' : '68%')}>
              <RadarChart data={areas.map(area => ({ ...area, previousScore: previousScores?.[area.id] }))} outerRadius={radius} accessibilityLayer={false}>
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border-strong)" }}
                  tick={({ x, y, textAnchor, verticalAnchor, index }) => (
                    <AffinityRadarAxisTick
                      area={areas[index]}
                      x={x}
                      y={y}
                      textAnchor={textAnchor}
                      verticalAnchor={verticalAnchor}
                      onAreaClick={onAreaClick}
                    />
                  )}
                />
                <PolarRadiusAxis
                  angle={90}
                  domain={[0, MAX_SCORE]}
                  tickCount={LEVEL_TICK_COUNT}
                  axisLine={false}
                  tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }}
                />
                {showPrevious ? <Radar name="Publicación anterior" dataKey="previousScore" stroke="#d97706" strokeWidth={2} strokeDasharray="6 4" fill="#d97706" fillOpacity={0.08} isAnimationActive={false} dot={{ r: 4, stroke: "#d97706", strokeWidth: 2, fill: "var(--color-surface)" }} /> : null}
                <Radar
                  name={SERIES_LABEL}
                  dataKey="score"
                  stroke="var(--color-accent)"
                  strokeWidth={2}
                  isAnimationActive={false}
                  fill="var(--color-accent)"
                  fillOpacity={0.14}
                  dot={({ cx, cy, index }) => (
                    <AffinityRadarDot
                      key={areas[index].id}
                      area={areas[index]}
                      cx={cx}
                      cy={cy}
                      onAreaClick={onAreaClick}
                    />
                  )}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-text-secondary">
          <p className="flex items-center gap-2">
            <span
              className="h-2.5 w-5 rounded-sm border border-accent bg-accent/15"
              aria-hidden="true"
            />
            {showPrevious ? `Actual (línea continua): ${publishedAt ? formatDate(publishedAt) : "Sin fecha"}` : SERIES_LABEL}
          </p>
          {showPrevious ? <p className="flex items-center gap-2"><span aria-hidden="true" className="w-5 border-t-2 border-dashed border-[#d97706]" />Anterior (línea discontinua): {previousPublishedAt ? formatDate(previousPublishedAt) : "Sin fecha"}</p> : null}
          </div>
        </>
      ) : (
        <div className="mt-6 flex min-h-60 flex-1 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border-strong bg-surface-soft p-6 text-center">
          <p className="text-sm font-semibold text-ink">Aún no hay datos de afinidad</p>
          <p className="text-xs text-text-secondary">
            El radar se mostrará cuando el perfil tenga áreas con puntaje.
          </p>
        </div>
      )}
    </RadarCard>
  );
}
