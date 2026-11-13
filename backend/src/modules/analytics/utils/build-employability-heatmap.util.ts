import {
  EMPLOYMENT_STATUSES,
  HEATMAP_BASE_LABELS,
  HEATMAP_EXTRA_COLUMNS,
} from '../constants/heatmap.constants.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse, HeatmapRow } from '../types/heatmap.types.js';
import { buildCell, toPercentage } from './heatmap-math.util.js';
import { allSkills, hasSkill, selectTopSkills } from './heatmap-skills.util.js';

const RETAINING_STATUSES = new Set<string>(
  EMPLOYMENT_STATUSES.filter((status) => status.retains).map((status) => status.id),
);

export function buildEmployabilityHeatmap(
  graduates: HeatmapGraduate[],
): HeatmapResponse {
  const base = graduates.filter((graduate) => graduate.employmentStatus !== null);
  const rows: HeatmapRow[] = selectTopSkills(base, allSkills)
    .map((skill) => {
      const holders = base.filter((graduate) => hasSkill(graduate, skill.id, allSkills));
      const retained = holders.filter((graduate) =>
        RETAINING_STATUSES.has(graduate.employmentStatus ?? ''),
      ).length;

      return {
        skillId: skill.id,
        skillName: skill.name,
        cells: EMPLOYMENT_STATUSES.map((status) =>
          buildCell(
            status.id,
            holders.filter((graduate) => graduate.employmentStatus === status.id).length,
            holders.length,
          ),
        ),
        extraValues: {
          [HEATMAP_EXTRA_COLUMNS.totalGraduates.id]: { count: holders.length, subtext: 'titulados' },
          [HEATMAP_EXTRA_COLUMNS.jobRetention.id]: {
            count: retained,
            percentage: toPercentage(retained, holders.length),
            subtext: `${retained} de ${holders.length}`,
          },
        },
      };
    })
    .sort(
      (first, second) =>
        retentionOf(second) - retentionOf(first) || holdersOf(second) - holdersOf(first),
    );
  const [leader] = rows;

  return {
    heatmapType: 'employability',
    baseCount: base.length,
    baseLabel: HEATMAP_BASE_LABELS.employability,
    columns: EMPLOYMENT_STATUSES.map((status) => {
      const total = base.filter((graduate) => graduate.employmentStatus === status.id).length;
      return { id: status.id, label: status.label, sublabel: `${total} titulados`, total };
    }),
    extraColumnsConfig: [HEATMAP_EXTRA_COLUMNS.totalGraduates, HEATMAP_EXTRA_COLUMNS.jobRetention],
    rows,
    quickReadSummary: leader
      ? `${leader.skillName} tiene la mayor retención laboral: ${retentionOf(leader)}% de quienes la dominan están empleados o trabajan de forma independiente.`
      : undefined,
  };
}

function retentionOf(row: HeatmapRow): number {
  return row.extraValues?.[HEATMAP_EXTRA_COLUMNS.jobRetention.id]?.percentage ?? 0;
}

function holdersOf(row: HeatmapRow): number {
  return row.extraValues?.[HEATMAP_EXTRA_COLUMNS.totalGraduates.id]?.count ?? 0;
}
