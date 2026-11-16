import { RADAR_AXIS_NAMES } from '@/modules/radar-chart/public';
export const VERIFICATION_AREA_NAMES: Record<string, string> =
  Object.fromEntries(RADAR_AXIS_NAMES.map((area) => [area.id, area.name]));
