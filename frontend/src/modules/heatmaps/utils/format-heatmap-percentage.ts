export function formatHeatmapPercentage(value: number, decimals?: number): string {
  if (decimals === undefined) return `${value}%`;
  return `${value.toLocaleString("es-BO", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}%`;
}
