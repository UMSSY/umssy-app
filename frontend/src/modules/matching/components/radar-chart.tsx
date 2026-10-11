"use client";

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

/**
 * Componente de radar genérico e independiente del módulo Matching: no depende
 * de los tipos de `matching-types.ts` a propósito, para poder moverse tal cual a
 * `shared/components` o a la EPIC "Radar Chart" (HU1) cuando esa EPIC se integre
 * en esta rama, sin arrastrar acoplamientos.
 */

export interface RadarChartAxis {
  id: string;
  label: string;
}

export interface RadarChartSeries {
  id: string;
  name: string;
  color: string;
  /** Puntaje por eje (misma escala que `maxValue`), indexado por `axis.id`. */
  values: Record<string, number>;
}

interface RadarChartProps {
  axes: RadarChartAxis[];
  series: RadarChartSeries[];
  maxValue?: number;
  height?: number;
}

export function RadarChart({ axes, series, maxValue = 10, height = 320 }: RadarChartProps) {
  const data = axes.map((axis) => {
    const row: Record<string, string | number> = { axis: axis.label };
    series.forEach((s) => {
      row[s.id] = s.values[axis.id] ?? 0;
    });
    return row;
  });

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <RechartsRadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, maxValue]}
            tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            axisLine={false}
            tickCount={6}
          />
          {series.map((s, index) => (
            <Radar
              key={s.id}
              name={s.name}
              dataKey={s.id}
              stroke={s.color}
              fill={s.color}
              fillOpacity={index === 0 ? 0.35 : 0.12}
              strokeWidth={index === 0 ? 2 : 1.5}
              strokeDasharray={index === 0 ? undefined : "4 3"}
            />
          ))}
          <Tooltip
            contentStyle={{
              background: "var(--popover)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--popover-foreground)",
              fontSize: 12,
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default RadarChart;
