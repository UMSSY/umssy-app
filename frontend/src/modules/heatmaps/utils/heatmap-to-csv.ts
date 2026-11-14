import { HEATMAP_TEXT } from "../constants/heatmap-text.constants";
import type { HeatmapData } from "../types/heatmap.types";

function escapeCsv(value: string | number): string {
  const text = String(value ?? "");
  return /[",\n;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function heatmapToCsv(data: HeatmapData): string {
  const extras = data.extraColumnsConfig ?? [];
  const header = [
    HEATMAP_TEXT.rowHeader,
    ...data.columns.flatMap((column) => [`${column.label} (cantidad)`, `${column.label} (%)`]),
    ...extras.map((extra) => extra.label),
  ];
  const rows = (data.rows ?? []).map((row): (string | number)[] => [
    row.skillName,
    ...data.columns.flatMap((column) => {
      const cell = row.cells.find((item) => item.columnId === column.id);
      return cell && !cell.isEmpty ? [String(cell.count ?? 0), String(cell.percentage ?? 0)] : ["", ""];
    }),
    ...extras.map((extra) => {
      const value = row.extraValues?.[extra.id];
      if (!value) return "";
      if (value.badgeText) return value.badgeText;
      return value.percentage !== undefined ? `${value.percentage}%` : (value.count ?? "");
    }),
  ]);

  const lines: (string | number)[][] = [[HEATMAP_TEXT.base(data.baseCount, data.baseLabel)], header, ...rows];
  return lines.map((line) => line.map(escapeCsv).join(",")).join("\n");
}
