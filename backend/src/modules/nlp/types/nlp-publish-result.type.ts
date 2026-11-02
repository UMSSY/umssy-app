import type { ProfileSkillProcessingState } from './profile-skill-processing-state.type.js';

export interface NlpPublishResult {
  state: ProfileSkillProcessingState;
  changed: boolean;
}
