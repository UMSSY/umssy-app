import type { RadarAreaScore } from "./radar-profile.types";

export interface Epic2Skill {
  id: string;
  text: string;
  name: string;
  source: "manual" | "nlp";
  areaId: string | null;
  verificationStatus: string;
  isHighRelevance: boolean;
  evidenceRefs: Array<{ type: string; id: string }>;
}
export interface Epic2RadarSource {
  userId: string;
  status: "ready" | "pending" | "error";
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: Epic2Skill[];
}
export interface RadarBridgeView {
  processingStatus?: 'ready' | 'pending' | 'error';
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
