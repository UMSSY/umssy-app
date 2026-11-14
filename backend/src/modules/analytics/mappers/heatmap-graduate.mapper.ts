import {
  EMPLOYMENT_STATUS_QUESTION,
  EMPLOYMENT_STATUSES,
  MONTHLY_SALARY_QUESTION,
  NLP_SKILL_SOURCE,
  SALARY_RANGES,
} from '../constants/heatmap.constants.js';
import type {
  EmploymentStatusId,
  HeatmapGraduate,
  HeatmapGraduateRecord,
  SalaryRangeId,
} from '../types/heatmap-graduate.types.js';
import { computeExperienceYears } from '../utils/experience-years.util.js';

function findOptionLabel(
  record: HeatmapGraduateRecord,
  statement: string,
): string | undefined {
  return record.answers.find((answer) => answer.question.statement === statement)
    ?.option?.label;
}

// Conserva solo la respuesta más reciente de cada titulado.
export function toHeatmapGraduates(
  records: HeatmapGraduateRecord[],
  now: Date,
): HeatmapGraduate[] {
  const latest = new Map<string, HeatmapGraduateRecord>();
  for (const record of records ?? []) {
    if (!record.respondent.approvedAccessRequest) continue;
    const current = latest.get(record.respondentId);
    if (!current || current.submittedAt < record.submittedAt)
      latest.set(record.respondentId, record);
  }

  return [...latest.values()].map((record) => {
    const employmentLabel = findOptionLabel(record, EMPLOYMENT_STATUS_QUESTION);
    const salaryLabel = findOptionLabel(record, MONTHLY_SALARY_QUESTION);
    const skills = new Map(
      record.respondent.userSkills.map((userSkill) => [
        userSkill.skill.id,
        {
          id: userSkill.skill.id,
          name: userSkill.skill.name,
          isNlp: userSkill.source === NLP_SKILL_SOURCE,
        },
      ]),
    );

    return {
      userId: record.respondentId,
      careerId: record.respondent.approvedAccessRequest!.careerId,
      answeredAt: record.submittedAt,
      skills: [...skills.values()],
      employmentStatus: (EMPLOYMENT_STATUSES.find(
        (status) => status.label === employmentLabel,
      )?.id ?? null) as EmploymentStatusId | null,
      salaryRange: (SALARY_RANGES.find((range) => range.label === salaryLabel)
        ?.id ?? null) as SalaryRangeId | null,
      experienceYears: computeExperienceYears(
        record.respondent.workExperiences,
        now,
      ),
    };
  });
}
