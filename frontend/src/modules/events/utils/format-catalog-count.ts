import type { CatalogCountMode } from '../types/catalog-count-mode.types';

const LABELS: Record<CatalogCountMode, [string, string]> = {
  available: ['taller disponible', 'talleres disponibles'],
  expired: ['propuesta vencida', 'propuestas vencidas'],
  finished: ['taller finalizado', 'talleres finalizados'],
};

// Texto del contador del catálogo según el filtro activo.
export function formatCatalogCount(count: number, mode: CatalogCountMode): string {
  const [singular, plural] = LABELS[mode];
  return `${count} ${count === 1 ? singular : plural}`;
}
