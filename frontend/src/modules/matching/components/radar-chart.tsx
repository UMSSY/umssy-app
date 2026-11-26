"use client";

import type { RadarChartProps } from "../types/radar-chart-props.types";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { AffinityRadarAxisTick } from "@/modules/radar-chart";
import { AffinityRadarDot } from "@/modules/radar-chart";
import { cn } from "@/lib/utils";

export function RadarChart({
  axes,
  series,
  maxValue = 10,
  height = 320,
  onAxisSelect,
}: RadarChartProps) {
  const candidateSeries = series.find((item) => item.id === "candidate");
  const targetSeries = series.find((item) => item.id === "target");
  const legendSeries = targetSeries
    ? [targetSeries, ...series.filter((item) => item.id !== "target")]
    : series;

  const data = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.label };
    series.forEach((item) => {
      row[item.id] = item.values[axis.id] ?? 0;
    });
    return row;
  });

  return (
    <div className="min-w-0">
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>
          <RechartsRadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="var(--color-border)" />
            <PolarAngleAxis
              dataKey="axis"
              tick={({ x, y, textAnchor, verticalAnchor, index }) => {
                const axis = axes[index];
                if (!axis) return <g />;
                return (
                  <AffinityRadarAxisTick
                    area={{
                      id: axis.id,
                      name: axis.label,
                      score: candidateSeries?.values[axis.id] ?? 0,
                    }}
                    x={x}
                    y={y}
                    textAnchor={textAnchor}
                    verticalAnchor={verticalAnchor}
                    onAreaClick={onAxisSelect}
                  />
                );
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, maxValue]}
              tick={{ fill: "var(--color-text-secondary)", fontSize: 10 }}
              axisLine={false}
              tickCount={6}
            />
            {series.map((item) => (
              <Radar
                key={item.id}
                name={item.name}
                dataKey={item.id}
                stroke={item.color}
                fill={item.color}
                fillOpacity={item.id === "candidate" ? 0.15 : 0}
                strokeWidth={item.id === "target" ? 3 : 2.5}
                strokeDasharray={item.id === "target" ? "4 3" : undefined}
                dot={
                  item.id === "candidate"
                    ? ({ cx, cy, index }) => {
                        const axis = axes[index];
                        if (!axis) return <g />;
                        return (
                          <AffinityRadarDot
                            key={axis.id}
                            area={{ id: axis.id, name: axis.label, score: item.values[axis.id] ?? 0 }}
                            cx={cx}
                            cy={cy}
                            onAreaClick={onAxisSelect}
                            className="fill-radar-candidate"
                          />
                        );
                      }
                    : false
                }
              />
            ))}
            <Tooltip
              contentStyle={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius)",
                color: "var(--color-ink)",
                fontSize: 12,
              }}
            />
          </RechartsRadarChart>
        </ResponsiveContainer>
      </div>
      <div
        role="list"
        aria-label="Leyenda del radar comparativo"
        className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs text-muted-foreground"
      >
        {legendSeries.map((item) => (
          <div key={item.id} role="listitem" className="inline-flex items-center gap-1.5">
            <span className={cn("w-8 shrink-0 border-t-3", item.id === "target" ? "border-dashed" : "border-solid")} style={{ borderColor: item.color }} aria-hidden="true" />
            <span>{item.name}<span className="sr-only">{item.id === "target" ? ", línea discontinua" : ", línea continua"}</span></span>
          </div>
        ))}
      </div>
      {onAxisSelect && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Selecciona un eje o un punto del radar para ver sus evidencias.
        </p>
      )}
    </div>
  );
}
