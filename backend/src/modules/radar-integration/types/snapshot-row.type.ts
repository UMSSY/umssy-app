import type { Scores } from '../radar-scoring.js';
import type { PublishedSkill } from './published-skill.type.js';

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
