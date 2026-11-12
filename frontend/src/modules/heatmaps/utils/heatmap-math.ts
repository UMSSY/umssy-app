import type { HeatmapCell } from "../types/heatmap.types";

export function toPercentage(count: number, total: number): number {
  return total > 0 ? Math.round((count / total) * 100) : 0;
}

export function buildCell(columnId: string, count: number, total: number): HeatmapCell {
  if (total <= 0) return { columnId, count: 0, total: 0, isEmpty: true };
  return { columnId, count, total, percentage: toPercentage(count, total), isEmpty: false };
}

export function countWithSkill<T>(records: T[], skillId: string, getSkills: (record: T) => string[]): number {
  return records.filter((record) => (getSkills(record) ?? []).includes(skillId)).length;
}
