import { MAX_HEATMAP_SKILL_ROWS } from '../constants/heatmap.constants.js';
import type {
  HeatmapGraduate,
  HeatmapSkill,
} from '../types/heatmap-graduate.types.js';

export type SkillSelector = (graduate: HeatmapGraduate) => HeatmapSkill[];

export const allSkills: SkillSelector = (graduate) => graduate.skills;
export const nlpSkills: SkillSelector = (graduate) =>
  graduate.skills.filter((skill) => skill.isNlp);

export function hasSkill(
  graduate: HeatmapGraduate,
  skillId: string,
  select: SkillSelector,
): boolean {
  return select(graduate).some((skill) => skill.id === skillId);
}

export function countWithSkill(
  graduates: HeatmapGraduate[],
  skillId: string,
  select: SkillSelector,
): number {
  return graduates.filter((graduate) => hasSkill(graduate, skillId, select))
    .length;
}

export function selectTopSkills(
  graduates: HeatmapGraduate[],
  select: SkillSelector,
  limit = MAX_HEATMAP_SKILL_ROWS,
): HeatmapSkill[] {
  const counts = new Map<string, { skill: HeatmapSkill; count: number }>();
  for (const graduate of graduates) {
    for (const skill of select(graduate)) {
      const current = counts.get(skill.id);
      counts.set(skill.id, { skill, count: (current?.count ?? 0) + 1 });
    }
  }
  return [...counts.values()]
    .sort(
      (first, second) =>
        second.count - first.count ||
        first.skill.name.localeCompare(second.skill.name, 'es'),
    )
    .slice(0, limit)
    .map(({ skill }) => skill);
}
