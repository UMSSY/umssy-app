// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { formatCatalogCount } from './format-catalog-count';

describe('formatCatalogCount', () => {
  it('uses singular and plural for each catalog filter', () => {
    expect(formatCatalogCount(1, 'available')).toBe('1 taller disponible');
    expect(formatCatalogCount(15, 'available')).toBe('15 talleres disponibles');
    expect(formatCatalogCount(1, 'expired')).toBe('1 propuesta vencida');
    expect(formatCatalogCount(0, 'expired')).toBe('0 propuestas vencidas');
    expect(formatCatalogCount(1, 'finished')).toBe('1 taller finalizado');
    expect(formatCatalogCount(36, 'finished')).toBe('36 talleres finalizados');
  });
});
