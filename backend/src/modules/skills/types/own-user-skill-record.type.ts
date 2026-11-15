import type { UserSkillRecord } from './user-skill-record.type.js';

export interface OwnUserSkillRecord extends UserSkillRecord {
  source: string;
  evidenceRefs: unknown;
}
