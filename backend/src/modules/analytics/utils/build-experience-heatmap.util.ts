import {
  EXPERIENCE_LEVELS,
  HEATMAP_BASE_LABELS,
  HEATMAP_EXTRA_COLUMNS,
} from '../constants/heatmap.constants.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse } from '../types/heatmap-response.types.js';
import type { HeatmapRow } from '../types/heatmap-row.types.js';
import { getExperienceLevelIndex } from './experience-years.util.js';
import { buildCell, toPercentage } from './heatmap-math.util.js';
import { allSkills, countWithSkill, selectTopSkills } from './heatmap-skills.util.js';

export function buildExperienceHeatmap(
  graduates: HeatmapGraduate[],
): HeatmapResponse {
  const base = graduates.filter((graduate) => graduate.experienceYears !== null);
  const groups = EXPERIENCE_LEVELS.map((level, index) => ({
    level,
    graduates: base.filter(
      (graduate) => getExperienceLevelIndex(graduate.experienceYears ?? 0) === index,
    ),
  }));

  const rows: HeatmapRow[] = selectTopSkills(base, allSkills)
    .map((skill) => {
      const cells = groups.map((group) =>
        buildCell(
          group.level.id,
          countWithSkill(group.graduates, skill.id, allSkills),
          group.graduates.length,
        ),
      );
      const total = countWithSkill(base, skill.id, allSkills);
      const percentage = toPercentage(total, base.length);
      const leaderLabel = buildLeaderLabel(cells);

      return {
        skillId: skill.id,
        skillName: skill.name,
        cells,
        extraValues: {
          [HEATMAP_EXTRA_COLUMNS.totalMastering.id]: {
            count: total,
            percentage,
            subtext: `${percentage} % del total`,
          },
          [HEATMAP_EXTRA_COLUMNS.highestAdoption.id]: leaderLabel ? { badgeText: leaderLabel } : {},
        },
      };
    })
    .sort((first, second) => masteringOf(second) - masteringOf(first));
  const [top] = rows;
  const topAdoption = top?.extraValues?.[HEATMAP_EXTRA_COLUMNS.highestAdoption.id]?.badgeText;

  return {
    heatmapType: 'skills-by-experience',
    baseCount: base.length,
    baseLabel: HEATMAP_BASE_LABELS['skills-by-experience'],
    columns: groups.map((group) => ({
      id: group.level.id,
      label: group.level.label,
      sublabel: `${group.level.range} · ${group.graduates.length} titulados`,
      total: group.graduates.length,
    })),
    extraColumnsConfig: [
      { ...HEATMAP_EXTRA_COLUMNS.totalMastering, sublabel: `de ${base.length} titulados` },
      HEATMAP_EXTRA_COLUMNS.highestAdoption,
    ],
    rows,
    quickReadSummary:
      top && topAdoption
        ? `${top.skillName} es la habilidad más dominada (${masteringOf(top)} titulados, ${top.extraValues?.[HEATMAP_EXTRA_COLUMNS.totalMastering.id]?.percentage ?? 0}% del total) y alcanza su mayor adopción en el nivel ${topAdoption}.`
        : undefined,
  };
}

function buildLeaderLabel(cells: HeatmapRow['cells']): string | undefined {
  const candidates = cells.filter((cell) => !cell.isEmpty && (cell.count ?? 0) > 0);
  if (candidates.length === 0) return undefined;
  const maxPercentage = Math.max(...candidates.map((cell) => cell.percentage ?? 0));
  const labels = EXPERIENCE_LEVELS.filter((level) =>
    candidates.some((cell) => cell.columnId === level.id && (cell.percentage ?? 0) === maxPercentage),
  ).map((level) => level.label);
  if (labels.length <= 1) return labels[0];
  return `${labels.slice(0, -1).join(', ')} y ${labels[labels.length - 1]}`;
}

function masteringOf(row: HeatmapRow): number {
  return row.extraValues?.[HEATMAP_EXTRA_COLUMNS.totalMastering.id]?.count ?? 0;
}
