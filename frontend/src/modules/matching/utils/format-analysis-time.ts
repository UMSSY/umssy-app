export function formatAnalysisTime(elapsedMs: number): string {
  return `Análisis completado en ${(elapsedMs / 1000).toFixed(2)} s`;
}
