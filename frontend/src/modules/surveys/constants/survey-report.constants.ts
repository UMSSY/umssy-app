// El PDF no puede leer las variables CSS del tema, así que repite sus colores en hexadecimal.
export const SURVEY_REPORT_COLORS = {
  ink: "#0B1F2E",
  inkSoft: "#33465A",
  textSecondary: "#5B6470",
  primary: "#003770",
  danger: "#B4050F",
  border: "#E3E7EC",
  surfaceSoft: "#F6F7F9",
  surface: "#FFFFFF",
} as const;

export const SURVEY_REPORT_MESSAGES = {
  exportLabel: "Exportar PDF",
  noResponses: "No hay respuestas registradas para exportar",
  generating: "Generando vista previa...",
  previewTitle: "Vista previa del reporte",
  download: "Descargar PDF",
  success: "Reporte PDF generado. La descarga comenzará en un momento.",
  error: "No se pudo generar el reporte PDF. Intenta de nuevo.",
} as const;
