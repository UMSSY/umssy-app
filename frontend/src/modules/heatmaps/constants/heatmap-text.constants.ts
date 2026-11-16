import type { ExportFormatTexts } from "@/shared/types/export-format-texts.types";

export const HEATMAP_TEXT = {
  rowHeader: "Habilidad técnica",
  base: (count: number, label: string) => `Base: ${count} ${label}`,
  quickReadTitle: "Lectura rápida",
  legendLow: "Menor presencia",
  legendHigh: "Mayor presencia",
  legendEmpty: "Sin datos",
  emptyCell: "-",
  loadError: "No se pudo cargar el mapa de calor. Inténtalo de nuevo.",
  retry: "Reintentar",
  export: "Exportar",
  pdfPending: "Exportación PDF pendiente de integración.",
  csvReady: "CSV generado correctamente.",
  noSummary: "No hay datos suficientes para generar una lectura rápida.",
  cellTooltip: (count: number, total: number, unit: string, column: string, skill: string, percentage: number) =>
    `${count} de ${total} ${unit} de ${column} registran ${skill} (${percentage}%)`,
  cellTooltipTitle: (skill: string, column: string) => `${skill} · ${column}`,
  cellTooltipDetail: (count: number, total: number, unit: string, percentage: string) => `${count} de ${total} ${unit} (${percentage})`,
  legendMin: "0%",
  legendMax: "100%",
  helpLabel: "Más información",
} as const;

export const HEATMAP_CONTINUOUS_TONE = {
  minAlpha: 6,
  darkTextFrom: 46,
  lightText: "text-ink",
  darkText: "text-white",
} as const;

export const HEATMAP_EXPORT_FORMAT_TEXTS: ExportFormatTexts = {
  pdf: { label: "Exportar PDF", description: "Documento con el mapa de calor" },
  csv: { label: "Exportar CSV", description: "Datos planos para análisis" },
};

export const HEATMAP_TONE_SCALE = [
  { max: 15, className: "bg-primary/5 text-ink", legend: "0-15%" },
  { max: 30, className: "bg-primary/15 text-ink", legend: "16-30%" },
  { max: 45, className: "bg-primary/30 text-ink", legend: "31-45%" },
  { max: 60, className: "bg-primary/60 text-primary-foreground", legend: "46-60%" },
  { max: 80, className: "bg-primary/80 text-primary-foreground", legend: "61-80%" },
  { max: 100, className: "bg-primary text-primary-foreground", legend: "81-100%" },
] as const;

export const HEATMAP_EMPTY_TONE = "bg-muted text-text-secondary";

export const HEATMAPS_QUERY_KEYS = {
  all: ["heatmaps"] as const,
  detail: (type: string, filters: object) => ["heatmaps", type, filters] as const,
};
