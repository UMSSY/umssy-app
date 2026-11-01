import type { VacancyRequirements } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

export function toVacancyRequirements(
  vacancy: JobMatchRecord,
  extractedSkillNames: readonly string[] = [],
): VacancyRequirements {
  return {
    skills: [
      ...vacancy.skills.map(({ skill }) => skill.name),
      ...extractedSkillNames,
    ],
    careers: vacancy.requiredCareers,
    minExperienceYears: vacancy.minExperienceYears,
    others: vacancy.otherRequirements,
  };
}
