import { RADAR_AXIS_NAMES } from '@/modules/radar-chart';
export const VERIFICATION_AREA_LABELS = Object.fromEntries(
  RADAR_AXIS_NAMES.map((area) => [area.id, area.name]),
);
