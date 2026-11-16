import { describe, it, expect, vi } from 'vitest';
import { RadarEvidenceSourcesService } from '../services/radar-evidence-sources.service.js';
import type { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';
import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
describe('CV vigente de su dominio propietario', () => {
  it('no busca otro respaldo cuando el último CV aún no tiene extracción', async () => {
    const repository = { findCurrentCvText: vi.fn().mockResolvedValue([]) };
    const cvs = { currentCvMetadata: vi.fn().mockResolvedValue({ id: 'new' }) };
    const service = new RadarEvidenceSourcesService(
      repository as unknown as RadarEvidenceSourcesRepository,
      cvs as unknown as CvSourcesService,
    );
    expect(await service.findCurrentCvText('owner')).toEqual([]);
    expect(repository.findCurrentCvText).toHaveBeenCalledExactlyOnceWith(
      'owner',
      'new',
    );
  });
  it('sin CV no recupera evidencias históricas', async () => {
    const repository = { findCurrentCvText: vi.fn() };
    const cvs = { currentCvMetadata: vi.fn().mockResolvedValue(null) };
    const service = new RadarEvidenceSourcesService(
      repository as unknown as RadarEvidenceSourcesRepository,
      cvs as unknown as CvSourcesService,
    );
    expect(await service.findCurrentCvText('owner')).toEqual([]);
    expect(repository.findCurrentCvText).not.toHaveBeenCalled();
  });
});
