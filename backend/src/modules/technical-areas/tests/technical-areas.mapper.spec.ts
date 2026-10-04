import { describe, expect, it } from 'vitest';
import { TechnicalAreasMapper } from '../mappers/technical-areas.mapper.js';

describe('TechnicalAreasMapper', () => {
  const mapper = new TechnicalAreasMapper();

  it('convierte un registro en la respuesta de area tecnica', () => {
    const result = mapper.toResponse({
      id: 'a1',
      name: 'Backend',
      description: 'APIs',
    });

    expect(result).toEqual({ id: 'a1', name: 'Backend', description: 'APIs' });
  });

  it('conserva la descripcion nula', () => {
    const result = mapper.toResponse({ id: 'a2', name: 'QA', description: null });

    expect(result.description).toBeNull();
  });

  it('convierte una lista de registros', () => {
    const result = mapper.toResponseList([
      { id: 'a1', name: 'Backend', description: null },
      { id: 'a2', name: 'QA', description: null },
    ]);

    expect(result).toHaveLength(2);
    expect(result[1]?.name).toBe('QA');
  });

  it('devuelve una lista vacia cuando no hay registros', () => {
    expect(mapper.toResponseList([])).toEqual([]);
  });
});