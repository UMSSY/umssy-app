import { USER_SKILL_SOURCES } from '../../skills/constants/user-skill.constants.js';
import type { UserSkillSummaryResponse } from '../../skills/responses/user-skill-summary.response.js';
import type { WorkPeriodResponse } from '../../work-experience/responses/work-period.response.js';
import {
  EMPLOYMENT_STATUSES,
  SALARY_RANGES,
} from '../constants/heatmap.constants.js';
import type { EmploymentStatusId } from '../types/employment-status-id.types.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapGraduateSources } from '../types/heatmap-graduate-sources.types.js';
import type { HeatmapSkill } from '../types/heatmap-skill.types.js';
import type { SalaryRangeId } from '../types/salary-range-id.types.js';
import { computeExperienceYears } from '../utils/experience-years.util.js';

function groupByUserId<TItem extends { userId: string }>(
  items: TItem[],
): Map<string, TItem[]> {
  const groups = new Map<string, TItem[]>();
  for (const item of items ?? []) {
    groups.set(item.userId, [...(groups.get(item.userId) ?? []), item]);
  }
  return groups;
}

function toHeatmapSkills(skills: UserSkillSummaryResponse[]): HeatmapSkill[] {
  const unique = new Map(
    skills.map((skill) => [
      skill.skillId,
      {
        id: skill.skillId,
        name: skill.skillName,
        isNlp: skill.source === USER_SKILL_SOURCES.nlp,
      },
    ]),
  );
  return [...unique.values()];
}

function toEmploymentStatusId(
  label: string | null,
): EmploymentStatusId | null {
  return EMPLOYMENT_STATUSES.find((status) => status.label === label)?.id ?? null;
}

function toSalaryRangeId(label: string | null): SalaryRangeId | null {
  return SALARY_RANGES.find((range) => range.label === label)?.id ?? null;
}

export function toHeatmapGraduates(
  sources: HeatmapGraduateSources,
  now: Date,
): HeatmapGraduate[] {
  const careerByUserId = new Map(
    (sources.careers ?? []).map((career) => [career.userId, career.careerId]),
  );
  const skillsByUserId = groupByUserId(sources.skills);
  const periodsByUserId = groupByUserId<WorkPeriodResponse>(sources.workPeriods);

  return (sources.responses ?? []).flatMap((response) => {
    const careerId = careerByUserId.get(response.respondentId);
    if (!careerId) return [];
    return [
      {
        userId: response.respondentId,
        careerId,
        answeredAt: response.submittedAt,
        skills: toHeatmapSkills(skillsByUserId.get(response.respondentId) ?? []),
        employmentStatus: toEmploymentStatusId(response.employmentStatusLabel),
        salaryRange: toSalaryRangeId(response.monthlySalaryLabel),
        experienceYears: computeExperienceYears(
          periodsByUserId.get(response.respondentId) ?? [],
          now,
        ),
      },
    ];
  });
}
