import { HEATMAP_CAREERS, HEATMAP_SKILLS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapData } from "../types/heatmap.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCell, countWithSkill } from "./heatmap-math";

export function buildCareerHeatmap(records: HeatmapGraduateRecord[]): HeatmapData {
  const base = (records ?? []).filter((record) => record.skills.length > 0);
  const groups = HEATMAP_CAREERS.map((career) => ({ career, records: base.filter((record) => record.career === career.id) }));
  const columns = groups.map(({ career, records: group }) => ({ id: career.id, label: `${career.label} (n=${group.length})`, total: group.length }));

  const rows = HEATMAP_SKILLS.map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    cells: groups.map(({ career, records: group }) => buildCell(career.id, countWithSkill(group, skill.id, (record) => record.skills), group.length)),
  })).sort((first, second) => sumCounts(second.cells) - sumCounts(first.cells));

  return {
    heatmapType: "skills-by-career",
    baseCount: base.length,
    baseLabel: "egresados con habilidades técnicas registradas",
    columns,
    rows,
    quickReadSummary: summarize(rows, groups.map(({ career }) => career.label)),
  };
}

function sumCounts(cells: { count?: number }[]): number {
  return cells.reduce((total, cell) => total + (cell.count ?? 0), 0);
}

function summarize(rows: HeatmapData["rows"], careerLabels: string[]): string | undefined {
  const comparable = rows.filter((row) => row.cells.every((cell) => !cell.isEmpty));
  if (comparable.length === 0) return undefined;

  const [top] = [...comparable].sort((first, second) => (second.cells[0].percentage ?? 0) + (second.cells[1].percentage ?? 0) - (first.cells[0].percentage ?? 0) - (first.cells[1].percentage ?? 0));
  const gap = [...comparable].sort(
    (first, second) => Math.abs((second.cells[0].percentage ?? 0) - (second.cells[1].percentage ?? 0)) - Math.abs((first.cells[0].percentage ?? 0) - (first.cells[1].percentage ?? 0)),
  )[0];
  const gapPoints = Math.abs((gap.cells[0].percentage ?? 0) - (gap.cells[1].percentage ?? 0));
  const leader = (gap.cells[0].percentage ?? 0) >= (gap.cells[1].percentage ?? 0) ? careerLabels[0] : careerLabels[1];

  return `${top.skillName} es la habilidad con mayor presencia en ambas carreras. La mayor diferencia está en ${gap.skillName}: ${gapPoints} puntos a favor de ${leader}.`;
}
