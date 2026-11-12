import type { Scores } from '../radar-scoring.js';

export interface RecruiterSnapshot {
  user_id: string;
  version: number;
  scores: Scores;
  evidence: Record<string, { id: string; name: string }[]>;
  average_score: string | number;
  created_at: Date;
}
