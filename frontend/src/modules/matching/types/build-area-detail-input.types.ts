import type { RadarAxisId } from "./radar-axis-id.types";
import type { AreaEvidence } from "./area-evidence.types";

export interface BuildAreaDetailInput {
  areaId: RadarAxisId;
  score: number;
  average: number;
  evidence: AreaEvidence;
}
