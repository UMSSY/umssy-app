import { describe, expect, it, vi } from 'vitest';
import { TechnicalAreasService } from '../services/technical-areas.service.js';
import { TechnicalAreasMapper } from '../mappers/technical-areas.mapper.js';
import type { TechnicalAreasRepository } from '../repositories/technical-areas.repository.js';

describe('TechnicalAreasService', () => {
  it('devuelve las areas tecnicas mapeadas', async () => {
    const findAll = vi
      .fn()
      .mockResolvedValue([{ id: 'a1', name: 'Backend', description: 'APIs' }]);
    const repository = { findAll } as unknown as TechnicalAreasRepository;
    const service = new TechnicalAreasService(repository, new TechnicalAreasMapper());

    const result = await service.findAll();

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual([{ id: 'a1', name: 'Backend', description: 'APIs' }]);
  });

  it('devuelve una lista vacia cuando no existen areas', async () => {
    const findAll = vi.fn().mockResolvedValue([]);
    const repository = { findAll } as unknown as TechnicalAreasRepository;
    const service = new TechnicalAreasService(repository, new TechnicalAreasMapper());

    expect(await service.findAll()).toEqual([]);
  });
});