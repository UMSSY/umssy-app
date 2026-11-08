import { describe, expect, it, vi } from 'vitest';
import { RadarPublicationEvidenceService } from '../services/radar-publication-evidence.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import type { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import type { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import type { RadarEvidenceSourcesService } from '../services/radar-evidence-sources.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';

describe('Fuentes de evidencia de publicacion', () => {
  it('propaga el mismo contexto transaccional a todos los dominios', async () => {
    const skillRead = vi.fn().mockResolvedValue([]);
    const cvRead = vi.fn().mockResolvedValue([]);
    const workRead = vi.fn().mockResolvedValue([]);
    const educationRead = vi.fn().mockResolvedValue([]);
    const certificationRead = vi.fn().mockResolvedValue([]);
    const service = new RadarPublicationEvidenceService(
      {
        findApprovedPublicationSkills: skillRead,
      } as unknown as SkillAnalysisService,
      {
        findPublicationCvStates: cvRead,
      } as unknown as RadarEvidenceSourcesService,
      {
        findPublicationEvidenceIds: workRead,
      } as unknown as WorkExperienceSourcesService,
      {
        findPublicationEvidenceIds: educationRead,
      } as unknown as EducationSourcesService,
      {
        findPublicationEvidenceIds: certificationRead,
      } as unknown as CertificationSourcesService,
    );
    const context = { client: {} } as unknown as TransactionContext;
    const results = await service.read('owner', context);
    expect(results).toEqual([[], [], [], [], []]);
    for (const mock of [
      skillRead,
      cvRead,
      workRead,
      educationRead,
      certificationRead,
    ]) {
      expect(mock).toHaveBeenCalledWith('owner', context);
      expect(mock).toHaveBeenCalledTimes(1);
    }
  });
});
