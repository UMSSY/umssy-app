import type { NlpSkillRowCreate } from './nlp-skill-row-create.type.js';
import type { NlpSkillRowUpdate } from './nlp-skill-row-update.type.js';

export interface NlpSkillReconciliation {
  creates: NlpSkillRowCreate[];
  updates: NlpSkillRowUpdate[];
  deleteIds: string[];
}
