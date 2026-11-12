"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { WEEK_GRID_DENSITY_TEXT } from "../../constants/week-grid.constants";
import type { WeekGridDensityToggleProps } from "../../types/week-grid-density-toggle-props.types";
import { isWeekGridDensity } from "../../utils/week-grid.utils";

export function WeekGridDensityToggle({ density, onDensityChange }: WeekGridDensityToggleProps) {
  return (
    <ToggleGroup
      multiple={false}
      value={[density]}
      onValueChange={(values) => {
        if (isWeekGridDensity(values[0])) onDensityChange(values[0]);
      }}
      variant="outline"
      aria-label={WEEK_GRID_DENSITY_TEXT.label}
    >
      <ToggleGroupItem value="normal">{WEEK_GRID_DENSITY_TEXT.normal}</ToggleGroupItem>
      <ToggleGroupItem value="compact">{WEEK_GRID_DENSITY_TEXT.compact}</ToggleGroupItem>
    </ToggleGroup>
  );
}
