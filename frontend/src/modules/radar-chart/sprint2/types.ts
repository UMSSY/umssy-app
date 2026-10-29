import type { AreaId } from "../types/area-detail.types";
import type { RadarAreaScore } from "../types/radar-profile.types";

export const RADAR_AXIS_NAMES: ReadonlyArray<{ id: AreaId; name: string }> = [
  { id: "desarrollo", name: "Desarrollo" },
  { id: "cloud-devops", name: "Cloud/DevOps" },
  { id: "data-ai", name: "Data/AI" },
  { id: "qa", name: "QA" },
  { id: "ciberseguridad", name: "Ciberseguridad" },
  { id: "gobernanza-ti", name: "Gobernanza TI" },
];

/** Respuesta de epic/grupo-2-perfiles-y-NLP, no un contrato inventado. */
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
  /** A stable rubric marker: provisional, NOT yet agreed with PO. */
  rubric: string;
}
