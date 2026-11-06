import type { Epic2Skill } from "./epic2-skill.types";
import type { Epic2RadarSource } from "./epic2-radar-source.types";
import type { RadarAreaScore } from "./radar-profile.types";

export interface RadarBridgeView {
  processingStatus?: "ready" | "pending" | "error";
  userId: string;
  status: Epic2RadarSource["status"];
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  areas: RadarAreaScore[];
  average: number;
  approved: Epic2Skill[];
  pendingCount: number;
  keywordCount: number;
  highRelevanceCount: number;
  rubric: string;
}
