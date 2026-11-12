import { HEATMAP_SALARY_RANGES, HEATMAP_SKILLS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapData } from "../types/heatmap.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCell, countWithSkill } from "./heatmap-math";

function isInRange(salary: number, range: (typeof HEATMAP_SALARY_RANGES)[number]): boolean {
  return range.min === 0 ? salary <= range.max : salary > range.min && salary <= range.max;
}

export function buildSalaryHeatmap(records: HeatmapGraduateRecord[]): HeatmapData {
  const base = (records ?? []).filter((record) => record.monthlySalary !== null && record.nlpSkills.length > 0);
  const groups = HEATMAP_SALARY_RANGES.map((range) => ({ range, records: base.filter((record) => isInRange(record.monthlySalary ?? 0, range)) }));
  const columns = groups.map(({ range, records: group }) => ({ id: range.id, label: range.label, sublabel: `${group.length} titulados`, total: group.length }));

  const rows = HEATMAP_SKILLS.map((skill) => ({
    skillId: skill.id,
    skillName: skill.name,
    cells: groups.map(({ range, records: group }) => buildCell(range.id, countWithSkill(group, skill.id, (record) => record.nlpSkills), group.length)),
  })).sort((first, second) => countWithSkill(base, second.skillId, (record) => record.nlpSkills) - countWithSkill(base, first.skillId, (record) => record.nlpSkills));

  return {
    heatmapType: "skills-by-salary",
    baseCount: base.length,
    baseLabel: "titulados con rango salarial registrado",
    columns,
    rows,
    quickReadSummary: summarize(rows, columns),
  };
}

function summarize(rows: HeatmapData["rows"], columns: HeatmapData["columns"]): string | undefined {
  const topIndex = columns.map((column) => (column.total ?? 0) > 0).lastIndexOf(true);
  if (topIndex < 0) return undefined;

  const [leader] = [...rows].sort((first, second) => (second.cells[topIndex].percentage ?? 0) - (first.cells[topIndex].percentage ?? 0));
  return `En el rango «${columns[topIndex].label}», la tecnología más frecuente es ${leader.skillName} (${leader.cells[topIndex].percentage ?? 0}%).`;
}
