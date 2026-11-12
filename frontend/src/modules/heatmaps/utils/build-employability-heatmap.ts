import { HEATMAP_EMPLOYMENT_STATUSES, HEATMAP_EXTRA_COLUMNS, HEATMAP_SKILLS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapData } from "../types/heatmap.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCell, toPercentage } from "./heatmap-math";

export function buildEmployabilityHeatmap(records: HeatmapGraduateRecord[]): HeatmapData {
  const base = (records ?? []).filter((record) => record.employmentStatus !== null);
  const columns = HEATMAP_EMPLOYMENT_STATUSES.map((status) => {
    const total = base.filter((record) => record.employmentStatus === status.id).length;
    return { id: status.id, label: status.label, sublabel: `${total} titulados`, total };
  });

  const rows = HEATMAP_SKILLS.map((skill) => {
    const holders = base.filter((record) => record.skills.includes(skill.id));
    const retained = holders.filter((record) => HEATMAP_EMPLOYMENT_STATUSES.some((status) => status.retains && status.id === record.employmentStatus)).length;
    const retention = toPercentage(retained, holders.length);

    return {
      skillId: skill.id,
      skillName: skill.name,
      cells: HEATMAP_EMPLOYMENT_STATUSES.map((status) =>
        buildCell(status.id, holders.filter((record) => record.employmentStatus === status.id).length, holders.length),
      ),
      extraValues: {
        [HEATMAP_EXTRA_COLUMNS.totalGraduates.id]: { count: holders.length, subtext: "titulados" },
        [HEATMAP_EXTRA_COLUMNS.jobRetention.id]: { count: retained, percentage: retention, subtext: `${retained} de ${holders.length}` },
      },
    };
  }).sort((first, second) => retentionOf(second) - retentionOf(first) || holdersOf(second) - holdersOf(first));

  const leader = rows.find((row) => holdersOf(row) > 0);

  return {
    heatmapType: "employability",
    baseCount: base.length,
    baseLabel: "titulados con encuesta de empleabilidad respondida",
    columns,
    extraColumnsConfig: [HEATMAP_EXTRA_COLUMNS.totalGraduates, HEATMAP_EXTRA_COLUMNS.jobRetention],
    rows,
    quickReadSummary: leader
      ? `${leader.skillName} tiene la mayor retención laboral: ${retentionOf(leader)}% de quienes la dominan están empleados o trabajan de forma independiente.`
      : undefined,
  };
}

function holdersOf(row: { extraValues: Record<string, { count?: number }> }): number {
  return row.extraValues[HEATMAP_EXTRA_COLUMNS.totalGraduates.id]?.count ?? 0;
}

function retentionOf(row: { extraValues: Record<string, { percentage?: number }> }): number {
  return row.extraValues[HEATMAP_EXTRA_COLUMNS.jobRetention.id]?.percentage ?? 0;
}
