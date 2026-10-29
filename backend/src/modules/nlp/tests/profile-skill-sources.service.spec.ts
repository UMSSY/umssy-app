import type { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import type { RadarEvidenceSourcesRepository } from '../../radar-integration/radar-evidence-sources.repository.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import type { ProfileService } from '../../profile/services/profile.service.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { ProfileSkillSourcesService } from '../services/profile-skill-sources.service.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('ProfileSkillSourcesService', () => {
  const educations = { findAnalysisSources: vi.fn() };
  const workExperience = { findAnalysisSources: vi.fn() };
  const profile = { ensureProfileExists: vi.fn() };
  const skills = { findCatalog: vi.fn() };

  const certifications = {
    findManyByUserId: vi.fn(),
  };

  const radarEvidence = {
    findCurrentCvText: vi.fn(),
  };

  const service = new ProfileSkillSourcesService(
    educations as unknown as EducationSourcesService,
    workExperience as unknown as WorkExperienceSourcesService,
    profile as unknown as ProfileService,
    skills as unknown as SkillAnalysisService,
    certifications as unknown as CertificationsRepository,
    radarEvidence as unknown as RadarEvidenceSourcesRepository,
  );

  beforeEach(() => {
    vi.resetAllMocks();

    certifications.findManyByUserId.mockResolvedValue([]);
    radarEvidence.findCurrentCvText.mockResolvedValue([]);
  });


  it('delegates profile validation and propagates the owner exception', async () => {
    profile.ensureProfileExists.mockRejectedValue(new ProfileNotFoundException());

    await expect(service.ensureProfileExists(userId)).rejects.toBeInstanceOf(ProfileNotFoundException);
    expect(profile.ensureProfileExists).toHaveBeenCalledWith(userId);
  });

  it('assembles analysis texts through owner services without employer or institution names', async () => {
    workExperience.findAnalysisSources.mockResolvedValue([
      { id: 'w1', position: 'Desarrollador backend', description: 'APIs con Node.js', company: 'Privada' },
      { id: 'w2', position: 'Analista', description: null },
    ]);
    educations.findAnalysisSources.mockResolvedValue([
      { id: 'e1', degree: 'Ingeniería de Sistemas', description: '  ', institution: 'Privada' },
    ]);

    await expect(service.findTextSources(userId)).resolves.toEqual([
      { id: 'w1', type: 'work-experience', text: 'Desarrollador backend.\nAPIs con Node.js' },
      { id: 'w2', type: 'work-experience', text: 'Analista' },
      { id: 'e1', type: 'education', text: 'Ingeniería de Sistemas' },
    ]);
    expect(workExperience.findAnalysisSources).toHaveBeenCalledWith(userId);
    expect(educations.findAnalysisSources).toHaveBeenCalledWith(userId);
  });

  it('retrieves the official catalog through the skills service', async () => {
    const catalog = [{ id: 's1', name: 'Python', areaId: null }];
    skills.findCatalog.mockResolvedValue(catalog);

    await expect(service.findCatalog()).resolves.toBe(catalog);
    expect(skills.findCatalog).toHaveBeenCalledOnce();
  });

  it('propagates source failures to the analysis coordinator', async () => {
    educations.findAnalysisSources.mockRejectedValue(new Error('education unavailable'));
    workExperience.findAnalysisSources.mockResolvedValue([]);

    await expect(service.findTextSources(userId)).rejects.toThrow('education unavailable');
  });

  it('includes certifications and current CV text as NLP sources', async () => {
  workExperience.findAnalysisSources.mockResolvedValue([]);
  educations.findAnalysisSources.mockResolvedValue([]);

  certifications.findManyByUserId.mockResolvedValue([
    {
      id: 'cert-1',
      name: 'AWS Certified',
      issuingOrganization: 'Amazon',
    },
  ]);

  radarEvidence.findCurrentCvText.mockResolvedValue([
    {
      id: 'cv-1',
      type: 'cv',
      text: 'Python, Docker',
    },
  ]);

  await expect(service.findTextSources(userId)).resolves.toEqual([
    {
      id: 'cert-1',
      type: 'certification',
      text: 'AWS Certified. Amazon',
    },
    {
      id: 'cv-1',
      type: 'cv',
      text: 'Python, Docker',
    },
  ]);

    expect(certifications.findManyByUserId).toHaveBeenCalledWith(userId);
    expect(radarEvidence.findCurrentCvText).toHaveBeenCalledWith(userId);
  });
});
