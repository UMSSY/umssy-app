import type { SkillOrigin } from '../types/skill-origin.type.js';
import type { SkillResponse } from './skill.response.js';

export interface OwnSkillResponse extends SkillResponse {
  origins: SkillOrigin[];
}
