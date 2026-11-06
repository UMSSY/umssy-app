import type { Scores } from "./radar-scores.types";

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

