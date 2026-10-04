import { describe, expect, it, vi } from 'vitest';
import { TechnicalAreasController } from '../controllers/technical-areas.controller.js';
import type { TechnicalAreasService } from '../services/technical-areas.service.js';

describe('TechnicalAreasController', () => {
  it('delega la consulta de areas tecnicas al servicio', async () => {
    const areas = [{ id: 'a1', name: 'Backend', description: null }];
    const findAll = vi.fn().mockResolvedValue(areas);
    const service = { findAll } as unknown as TechnicalAreasService;
    const controller = new TechnicalAreasController(service);

    const result = await controller.findAll();

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(result).toEqual(areas);
  });
});