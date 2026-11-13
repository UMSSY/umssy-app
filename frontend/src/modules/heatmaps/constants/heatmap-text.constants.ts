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
  exportPdf: "Exportar PDF",
  exportPdfHint: "Documento con el mapa de calor",
  exportCsv: "Exportar CSV",
  exportCsvHint: "Datos planos para análisis",
  pdfPending: "Exportación PDF pendiente de integración.",
  csvReady: "CSV generado correctamente.",
  noSummary: "No hay datos suficientes para generar una lectura rápida.",
  cellTooltip: (count: number, total: number, unit: string, column: string, skill: string, percentage: number) =>
    `${count} de ${total} ${unit} de ${column} registran ${skill} (${percentage}%)`,
} as const;

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
