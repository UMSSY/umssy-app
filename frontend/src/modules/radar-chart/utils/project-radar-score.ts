import { RADAR_AXIS_NAMES } from "../constants/radar-axis-names.constants";
import type { AreaId } from "../types/area-id.types";
import type { RadarAreaScore } from "../types/radar-area-score.types";

export function projectRadarScore(areas: readonly RadarAreaScore[], areaId: AreaId, value: number) {
  const base = areas.find(area => area.id === areaId)?.score ?? 0;
  const score = Number.isFinite(value) ? Math.max(base, Math.min(10, value)) : base;
  const total = RADAR_AXIS_NAMES.reduce((sum, axis) => sum + (axis.id === areaId ? score : areas.find(area => area.id === axis.id)?.score ?? 0), 0);
  return { score, average: Number((total / RADAR_AXIS_NAMES.length).toFixed(2)) };
}
