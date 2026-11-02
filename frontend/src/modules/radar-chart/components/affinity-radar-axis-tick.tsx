"use client";

import type { KeyboardEvent } from "react";
import { Text } from "recharts";
import type { AffinityRadarAxisTickProps } from "../types/radar-profile-components.types";

export function AffinityRadarAxisTick({
  area,
  x,
  y,
  textAnchor,
  verticalAnchor,
  onAreaClick,
}: AffinityRadarAxisTickProps) {
  const label = (
    <Text
      x={x}
      y={y}
      textAnchor={textAnchor}
      verticalAnchor={verticalAnchor}
      className="fill-ink-soft text-sm font-semibold"
    >
      {area.name}
    </Text>
  );

  if (!onAreaClick) {
    return <g>{label}</g>;
  }

  function handleKeyDown(event: KeyboardEvent<SVGGElement>) {
    if (event.key !== "Enter" && event.key !== " ") return;

    event.preventDefault();
    onAreaClick?.(area.id);
  }

  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de ${area.name}`}
      onClick={() => onAreaClick(area.id)}
      onKeyDown={handleKeyDown}
      className="cursor-pointer outline-none hover:[&_text]:fill-accent focus-visible:[&_text]:fill-accent focus-visible:[&_text]:underline [&_text]:motion-safe:transition-colors"
    >
      {label}
    </g>
  );
}
