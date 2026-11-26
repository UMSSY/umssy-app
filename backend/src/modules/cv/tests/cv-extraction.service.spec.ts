import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SkillDetectionService } from '../../nlp/services/skill-detection.service.js';
import { SkillValidationService } from '../../nlp/services/skill-validation.service.js';
import type { CityCatalogService } from '../../profile/services/city-catalog.service.js';
import type { RadarPdfExtractionService } from '../../radar-integration/services/radar-pdf-extraction.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { CvExtractionFailedException } from '../exceptions/cv-extraction-failed.exception.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import { CvUnreadableException } from '../exceptions/cv-unreadable.exception.js';
import { CvExtractionMapper } from '../mappers/cv-extraction.mapper.js';
import { CvExtractionService } from '../services/cv-extraction.service.js';
import type { CvFileStorage } from '../types/cv-file-storage.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';
const content = Buffer.from('%PDF-1.7');

describe('CvExtractionService', () => {
  let storage: { readById: ReturnType<typeof vi.fn> };
  let extractor: { extract: ReturnType<typeof vi.fn> };
  let skillAnalysis: { findCatalog: ReturnType<typeof vi.fn> };
  let cityCatalog: { listCities: ReturnType<typeof vi.fn> };
  let service: CvExtractionService;

  beforeEach(() => {
    storage = { readById: vi.fn().mockResolvedValue(content) };
    extractor = { extract: vi.fn() };
    skillAnalysis = {
      findCatalog: vi.fn().mockResolvedValue([
        { id: 'skill-ts', name: 'TypeScript', areaId: null },
        { id: 'skill-docker', name: 'Docker', areaId: null },
      ]),
    };
    cityCatalog = {
      listCities: vi
        .fn()
        .mockResolvedValue([{ id: 'city-cbba', title: 'Cochabamba' }]),
    };
    service = new CvExtractionService(
      storage as unknown as CvFileStorage,
      extractor as unknown as RadarPdfExtractionService,
      new CvExtractionMapper(),
      new SkillDetectionService(),
      new SkillValidationService(),
      skillAnalysis as unknown as SkillAnalysisService,
      cityCatalog as unknown as CityCatalogService,
    );
  });

  it('reads the stored pdf of the user and structures its text', async () => {
    extractor.extract.mockResolvedValue({
      extractedText:
        'Juan Pérez\njuan@mail.com\nEXPERIENCIA\nDesarrollador\nEmpresa SRL\n2020 - 2022',
      extractionStatus: 'ready',
    });

    const result = await service.extract(userId, cvId);

    expect(storage.readById).toHaveBeenCalledWith(userId, cvId);
    expect(extractor.extract).toHaveBeenCalledWith(content);
    expect(result.cvId).toBe(cvId);
    expect(result.contact.email).toBe('juan@mail.com');
    expect(result.workExperiences).toEqual([
      expect.objectContaining({
        companyName: 'Empresa SRL',
        position: 'Desarrollador',
      }),
    ]);
  });

  it('detects catalog skills and the city of the cv', async () => {
    extractor.extract.mockResolvedValue({
      extractedText:
        'Juan Pérez\nCochabamba, Bolivia\nHABILIDADES TÉCNICAS\nTypeScript, Docker y liderazgo',
      extractionStatus: 'ready',
    });

    const result = await service.extract(userId, cvId);

    expect(result.skills).toEqual(
      expect.arrayContaining([
        { skillId: 'skill-ts', name: 'TypeScript' },
        { skillId: 'skill-docker', name: 'Docker' },
      ]),
    );
    expect(result.skills).toHaveLength(2);
    expect(result.contact.cityId).toBe('city-cbba');
  });

  it('propagates a catalog error instead of hiding the skills', async () => {
    extractor.extract.mockResolvedValue({
      extractedText: 'Juan Pérez',
      extractionStatus: 'ready',
    });
    const error = new Error('database down');
    skillAnalysis.findCatalog.mockRejectedValue(error);

    await expect(service.extract(userId, cvId)).rejects.toBe(error);
  });

  it('throws not found when the cv does not belong to the user', async () => {
    storage.readById.mockResolvedValue(null);

    await expect(service.extract(userId, cvId)).rejects.toBeInstanceOf(
      CvNotFoundException,
    );
    expect(extractor.extract).not.toHaveBeenCalled();
    expect(skillAnalysis.findCatalog).not.toHaveBeenCalled();
  });

  it('throws unreadable when the pdf has no text layer', async () => {
    extractor.extract.mockResolvedValue({
      extractedText: '',
      extractionStatus: 'unreadable',
    });

    await expect(service.extract(userId, cvId)).rejects.toBeInstanceOf(
      CvUnreadableException,
    );
  });

  it('throws extraction failed when the pdf cannot be opened', async () => {
    extractor.extract.mockResolvedValue({
      extractedText: '',
      extractionStatus: 'error',
    });

    await expect(service.extract(userId, cvId)).rejects.toBeInstanceOf(
      CvExtractionFailedException,
    );
  });
});
