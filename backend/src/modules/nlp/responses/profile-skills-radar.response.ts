import type { NlpProcessingStatus } from '../types/nlp-processing-status.type.js';
import type { ProfileSkillRadarItemResponse } from './profile-skill-radar-item.response.js';

export interface ProfileSkillsRadarResponse {
  userId: string;
  status: NlpProcessingStatus;
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: ProfileSkillRadarItemResponse[];
}
