// Formatos de los números de las analíticas, según los CA de la HU3 y la HU4.

// Tasa de respuesta con un decimal: 60.1%
export function formatResponseRate(value: number): string {
  return `${value.toFixed(1)}%`;
}

// Tasa de finalización sin decimales: 85%
export function formatCompletionRate(value: number): string {
  return `${Math.round(value)}%`;
}

// Porcentaje de una opción: hasta un decimal, sin ".0" (53%, 66.7%).
export function formatOptionPercentage(value: number): string {
  return `${Number(value.toFixed(1))}%`;
}

// Tiempo promedio en minutos:segundos: 225 segundos -> "3:45 min"
export function formatAverageTime(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")} min`;
}
