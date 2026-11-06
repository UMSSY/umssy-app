import type { ProfileSkillRadarItem } from "./profile-skill-radar-item.types";

export interface ProfileSkillsRadarResponse {
  userId: string;
  status: string;
  version: number;
  updatedAt: string | null;
  dictionaryVersion: string | null;
  skills: ProfileSkillRadarItem[];
}
