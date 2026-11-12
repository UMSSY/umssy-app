import { HEATMAP_EXPERIENCE_LEVELS, HEATMAP_EXTRA_COLUMNS, HEATMAP_SKILLS } from "../constants/heatmap-dimensions.constants";
import type { HeatmapData } from "../types/heatmap.types";
import type { HeatmapGraduateRecord } from "../types/heatmap-graduate-record.types";
import { buildCell, countWithSkill, toPercentage } from "./heatmap-math";

export function getExperienceLevel(years: number) {
  return HEATMAP_EXPERIENCE_LEVELS.find((level) => years > level.minExclusive && years <= level.max) ?? HEATMAP_EXPERIENCE_LEVELS[0];
}

export function buildExperienceHeatmap(records: HeatmapGraduateRecord[]): HeatmapData {
  const base = (records ?? []).filter((record) => record.experienceYears !== null);
  const groups = HEATMAP_EXPERIENCE_LEVELS.map((level) => ({ level, records: base.filter((record) => getExperienceLevel(record.experienceYears ?? 0).id === level.id) }));
  const columns = groups.map(({ level, records: group }) => ({ id: level.id, label: level.label, sublabel: `${level.range} · ${group.length} titulados`, total: group.length }));

  const rows = HEATMAP_SKILLS.map((skill) => {
    const cells = groups.map(({ level, records: group }) => buildCell(level.id, countWithSkill(group, skill.id, (record) => record.skills), group.length));
    const total = countWithSkill(base, skill.id, (record) => record.skills);
    const percentage = toPercentage(total, base.length);
    const leader = cells.filter((cell) => !cell.isEmpty).sort((first, second) => (second.percentage ?? 0) - (first.percentage ?? 0))[0];
    const leaderLabel = HEATMAP_EXPERIENCE_LEVELS.find((level) => level.id === leader?.columnId)?.label;

    return {
      skillId: skill.id,
      skillName: skill.name,
      cells,
      extraValues: {
        [HEATMAP_EXTRA_COLUMNS.totalMastering.id]: { count: total, percentage, subtext: `${percentage} % del total` },
        [HEATMAP_EXTRA_COLUMNS.highestAdoption.id]: leader && (leader.count ?? 0) > 0 && leaderLabel ? { badgeText: leaderLabel } : {},
      },
    };
  }).sort((first, second) => masteringOf(second) - masteringOf(first));

  const [top] = rows;
  const topAdoption = top?.extraValues[HEATMAP_EXTRA_COLUMNS.highestAdoption.id]?.badgeText;

  return {
    heatmapType: "skills-by-experience",
    baseCount: base.length,
    baseLabel: "titulados con experiencia laboral registrada",
    columns,
    extraColumnsConfig: [{ ...HEATMAP_EXTRA_COLUMNS.totalMastering, sublabel: `de ${base.length} titulados` }, HEATMAP_EXTRA_COLUMNS.highestAdoption],
    rows,
    quickReadSummary:
      base.length > 0 && top && topAdoption
        ? `${top.skillName} es la habilidad más dominada (${masteringOf(top)}% del total) y alcanza su mayor adopción en el nivel ${topAdoption}.`
        : undefined,
  };
}

function masteringOf(row: { extraValues: Record<string, { count?: number }> }): number {
  return row.extraValues[HEATMAP_EXTRA_COLUMNS.totalMastering.id]?.count ?? 0;
}
