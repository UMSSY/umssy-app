import type { RadarBridgeView } from './radar-bridge.types';
import type { AreaId } from './area-id.types';

export interface RadarEvidencePanelProps {
  actions?: import("react").ReactNode;
  radar: RadarBridgeView;
  selected: AreaId;
  onClose: () => void;
}
