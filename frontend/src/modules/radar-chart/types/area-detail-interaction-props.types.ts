import type { AreaId } from './area-id.types';

export interface AreaDetailInteractionProps {
  initialArea?: AreaId | null;
  selectedArea?: AreaId | null;
  onAreaSelect?: (areaId: AreaId) => void;
}
