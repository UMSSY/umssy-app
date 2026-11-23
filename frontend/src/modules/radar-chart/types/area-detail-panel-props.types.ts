import type { AreaDetail } from './area-detail.types';

export interface AreaDetailPanelProps {
  area: AreaDetail;
  onClose: () => void;
  className?: string;
}
