import { AREA_DETAILS } from '../data/area-details.data';
import type { AreaDetail } from '../types/area-detail.types';
import type { AreaId } from '../types/area-id.types';

export function getAreaDetail(id: AreaId): AreaDetail {
  return AREA_DETAILS[id];
}
