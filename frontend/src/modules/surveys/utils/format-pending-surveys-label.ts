export function formatPendingSurveysLabel(pendingCount: number): string {
  if (pendingCount === 0) return "Sin pendientes";
  return pendingCount === 1 ? "1 pendiente" : `${pendingCount} pendientes`;
}
