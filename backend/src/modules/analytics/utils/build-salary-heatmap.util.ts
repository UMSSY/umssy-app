import { HEATMAP_BASE_LABELS, SALARY_RANGES } from '../constants/heatmap.constants.js';
import type { HeatmapGraduate } from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse, HeatmapRow } from '../types/heatmap.types.js';
import { buildCell } from './heatmap-math.util.js';
import { countWithSkill, nlpSkills, selectTopSkills } from './heatmap-skills.util.js';

export function buildSalaryHeatmap(graduates: HeatmapGraduate[]): HeatmapResponse {
  const base = graduates.filter(
    (graduate) => graduate.salaryRange !== null && nlpSkills(graduate).length > 0,
  );
  const groups = SALARY_RANGES.map((range) => ({
    range,
    graduates: base.filter((graduate) => graduate.salaryRange === range.id),
  }));
  const rows: HeatmapRow[] = selectTopSkills(base, nlpSkills).map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    cells: groups.map((group) =>
      buildCell(
        group.range.id,
        countWithSkill(group.graduates, skill.id, nlpSkills),
        group.graduates.length,
      ),
    ),
  }));
  const columns = groups.map((group) => ({
    id: group.range.id,
    label: group.range.label,
    sublabel: `${group.graduates.length} titulados`,
    total: group.graduates.length,
  }));

  return {
    heatmapType: 'skills-by-salary',
    baseCount: base.length,
    baseLabel: HEATMAP_BASE_LABELS['skills-by-salary'],
    columns,
    rows,
    quickReadSummary: summarize(rows, columns),
  };
}

function summarize(
  rows: HeatmapRow[],
  columns: HeatmapResponse['columns'],
): string | undefined {
  const topIndex = columns.map((column) => (column.total ?? 0) > 0).lastIndexOf(true);
  if (topIndex < 0 || rows.length === 0) return undefined;

  const percentageAt = (row: HeatmapRow) => row.cells[topIndex]?.percentage ?? 0;
  const leader = [...rows].sort((first, second) => percentageAt(second) - percentageAt(first))[0]!;
  return `En el rango «${columns[topIndex]!.label}», la tecnología más frecuente es ${leader.skillName} (${percentageAt(leader)}%).`;
}
