import type { SkillRowCreatePayload } from './skill-row-create-payload.type.js';
import type { SkillRowUpdatePayload } from './skill-row-update-payload.type.js';

export interface SkillReconciliationPayload {
  creates: SkillRowCreatePayload[];
  updates: SkillRowUpdatePayload[];
  deleteIds: string[];
}
