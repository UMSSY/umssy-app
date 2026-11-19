import type { WeekGridDensity } from "./week-grid-density.types";

export interface WeekGridDensityToggleProps {
  density: WeekGridDensity;
  onDensityChange: (density: WeekGridDensity) => void;
}
