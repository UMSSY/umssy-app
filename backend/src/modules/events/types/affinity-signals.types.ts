import type { RadarAreaId } from '../../profile/types/radar-area-id.type.js';

export interface AffinitySignals {
  skills: string[];
  radarScores: Partial<Record<RadarAreaId, number>>;
  careers: string[];
  interests: string;
}
