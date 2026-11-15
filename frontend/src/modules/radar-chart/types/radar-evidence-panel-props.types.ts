import type { RadarBridgeView } from "./radar-bridge.types";
import type { AreaId } from "./area-detail.types";

export interface RadarEvidencePanelProps {
  actions?: import("react").ReactNode;
  radar: RadarBridgeView;
  selected: AreaId;
  onClose: () => void;
}
