import type { NlpDiscardedSkill } from './nlp-discarded-skill.type.js';
import type { NlpRejectedSource } from './nlp-rejected-source.type.js';

export interface NlpAnalysisOutcome {
  status: 'ready' | 'stale' | 'error';
  discarded: NlpDiscardedSkill[];
  rejectedSources: NlpRejectedSource[];
}
