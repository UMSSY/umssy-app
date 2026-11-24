import { RADAR_AXIS_NAMES } from '../constants/radar-axis-names.constants';

export function getRadarAreaName(areaId: string): string {
  return RADAR_AXIS_NAMES.find((area) => area.id === areaId)?.name ?? areaId;
}
