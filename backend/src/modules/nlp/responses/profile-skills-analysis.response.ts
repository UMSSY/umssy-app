import type { NlpDiscardedSkill } from '../types/nlp-discarded-skill.type.js';
import type { NlpRejectedSource } from '../types/nlp-rejected-source.type.js';
import type { ProfileSkillsRadarResponse } from './profile-skills-radar.response.js';

export interface ProfileSkillsAnalysisResponse extends ProfileSkillsRadarResponse {
  analysis: {
    discarded: NlpDiscardedSkill[];
    rejectedSources: NlpRejectedSource[];
  };
}
