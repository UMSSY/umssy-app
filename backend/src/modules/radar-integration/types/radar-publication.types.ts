import type { Scores } from '../radar-scoring.js';

export type PublishedSkill = {
  id: string;
  name: string;
  areaId: string | null;
  isHighRelevance: boolean;
  evidenceRefs: { type: string; id: string }[];
};

export type SnapshotRow = {
  user_id: string;
  version: number;
  rubric_version: string;
  fingerprint: string;
  scores: Scores;
  evidence: Record<string, { id: string; name: string }[]>;
  average_score: string | number;
  created_at: Date;
  source_revision: number | null;
  skills: PublishedSkill[];
};

export type RadarPublicationState = {
  snapshots: SnapshotRow[];
  pendingDocs: { count: bigint }[];
  pendingSkills: number;
  state: {
    status: string;
    inputRevision: number;
    processedRevision: number | null;
    dictionaryVersion: string | null;
  } | null;
  attempts: { status: string; source_revision: number | null }[];
};
