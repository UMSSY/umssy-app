import type { VacancyRequirements } from '../types/gap-analysis.types.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

export function toVacancyRequirements(
  vacancy: JobMatchRecord,
): VacancyRequirements {
  return {
    skills: vacancy.skills.map(({ skill }) => skill.name),
    careers: vacancy.requiredCareers,
    minExperienceYears: vacancy.minExperienceYears,
    others: vacancy.otherRequirements,
  };
}
