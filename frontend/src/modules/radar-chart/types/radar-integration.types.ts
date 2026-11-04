import type { AreaId } from "./area-detail.types";

/** Contrato del radar publicado por el backend. */
export type Scores = Record<AreaId, number>;

export interface IntegrationRadar {
  dictionaryVersion?: string | null;
  userId: string;
  status: string;
  version: number;
  rubricVersion: string;
  updatedAt: string | null;
  scores: Scores;
  average: number;
  variation: number | null;
  pending: number;
  hasPending: boolean;
  evidence: Record<string, { id: string; name: string }[]>;
  sourceRevision: number | null;
  inputRevision: number;
  processingStatus: "ready" | "pending" | "error";
  skills: {
    id: string;
    name: string;
    areaId: string | null;
    isHighRelevance: boolean;
    evidenceRefs: { type: string; id: string }[];
  }[];
}

export interface ReviewRow {
  id: string;
  userId: string;
  userName: string;
  type: "cv" | "skill";
  title: string;
  status: string;
  date: string;
  extractionStatus?: string;
  extractedCharacters?: number;
  areaId?: string;
  evidenceRefs?: unknown;
}
