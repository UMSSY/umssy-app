import { HEATMAP_BASE_LABELS } from '../constants/heatmap.constants.js';
import type {
  HeatmapCareer,
  HeatmapGraduate,
} from '../types/heatmap-graduate.types.js';
import type { HeatmapResponse, HeatmapRow } from '../types/heatmap.types.js';
import { shortenCareerTitle } from './heatmap-dates.util.js';
import { buildCell } from './heatmap-math.util.js';
import { allSkills, countWithSkill, selectTopSkills } from './heatmap-skills.util.js';

export function buildCareerHeatmap(
  graduates: HeatmapGraduate[],
  careers: HeatmapCareer[],
): HeatmapResponse {
  const base = graduates.filter((graduate) => graduate.skills.length > 0);
  const groups = careers.map((career) => ({
    career,
    graduates: base.filter((graduate) => graduate.careerId === career.id),
  }));
  const rows: HeatmapRow[] = selectTopSkills(base, allSkills).map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    cells: groups.map((group) =>
      buildCell(
        group.career.id,
        countWithSkill(group.graduates, skill.id, allSkills),
        group.graduates.length,
      ),
    ),
  }));

  return {
    heatmapType: 'skills-by-career',
    baseCount: base.length,
    baseLabel: HEATMAP_BASE_LABELS['skills-by-career'],
    columns: groups.map((group) => ({
      id: group.career.id,
      label: `${shortenCareerTitle(group.career.title)} (n=${group.graduates.length})`,
      total: group.graduates.length,
    })),
    rows,
    quickReadSummary: summarize(rows, groups.map((group) => shortenCareerTitle(group.career.title))),
  };
}

function summarize(rows: HeatmapRow[], labels: string[]): string | undefined {
  const comparable = rows.filter(
    (row) => row.cells.length >= 2 && row.cells.every((cell) => !cell.isEmpty),
  );
  if (comparable.length === 0) return undefined;

  const gapOf = (row: HeatmapRow) =>
    Math.abs((row.cells[0]!.percentage ?? 0) - (row.cells[1]!.percentage ?? 0));
  const [top] = comparable;
  const gap = [...comparable].sort((first, second) => gapOf(second) - gapOf(first))[0]!;
  const leader =
    (gap.cells[0]!.percentage ?? 0) >= (gap.cells[1]!.percentage ?? 0)
      ? labels[0]
      : labels[1];

  return `${top!.skillName} es la habilidad con mayor presencia entre los egresados evaluados. La mayor diferencia está en ${gap.skillName}: ${gapOf(gap)} puntos a favor de ${leader}.`;
}
