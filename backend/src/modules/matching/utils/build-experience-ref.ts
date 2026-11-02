import { EXPERIENCE_REF_PREFIX } from '../constants/experience-skills.constants.js';

export function buildExperienceRef(experienceId: string): string {
  return `${EXPERIENCE_REF_PREFIX}${experienceId}`;
}
