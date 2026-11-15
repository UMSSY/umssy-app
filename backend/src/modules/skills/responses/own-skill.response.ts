import type { SkillOriginSummary } from '../types/skill-origin-summary.type.js';
import type { SkillResponse } from './skill.response.js';

export interface OwnSkillResponse extends SkillResponse, SkillOriginSummary {}
