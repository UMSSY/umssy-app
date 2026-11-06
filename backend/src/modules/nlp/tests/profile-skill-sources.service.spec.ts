import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import type { ProfileService } from '../../profile/services/profile.service.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { ProfileSkillSourcesService } from '../services/profile-skill-sources.service.js';
import type { CvService } from '../../cv/services/cv.service.js';
import type { CertificationDocumentsService } from '../../certification-documents/services/certification-documents.service.js';
import type { DocumentSkillTextExtractorService } from '../services/document-skill-text-extractor.service.js';
import { NlpDocumentReadException } from '../exceptions/nlp-document-read.exception.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('ProfileSkillSourcesService', () => {
  const educations = { findAnalysisSources: vi.fn() };
  const workExperience = { findAnalysisSources: vi.fn() };
  const profile = { ensureProfileExists: vi.fn() };
  const skills = { findCatalog: vi.fn() };
  const cvs = { list: vi.fn(), getFileById: vi.fn() };
  const certifications = { findDocumentIds: vi.fn(), getFile: vi.fn() };
  const extractor = { extract: vi.fn() };
  const service = new ProfileSkillSourcesService(
    educations as unknown as EducationSourcesService,
    workExperience as unknown as WorkExperienceSourcesService,
    profile as unknown as ProfileService,
    skills as unknown as SkillAnalysisService,
    cvs as unknown as CvService,
    certifications as unknown as CertificationDocumentsService,
    extractor as unknown as DocumentSkillTextExtractorService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    cvs.list.mockResolvedValue({ items: [] });
    certifications.findDocumentIds.mockResolvedValue(new Set());
    educations.findAnalysisSources.mockResolvedValue([]);
    workExperience.findAnalysisSources.mockResolvedValue([]);
  });

  it('reads only the current CV through the owner service and preserves its evidence id', async () => {
    cvs.list.mockResolvedValue({ items: [{ id: 'current', isCurrent: true }, { id: 'old', isCurrent: false }] });
    const content = Buffer.from('pdf content');
    cvs.getFileById.mockResolvedValue({ content, mimeType: 'application/pdf' });
    extractor.extract.mockResolvedValue('Python SQL');
    await expect(service.findTextSources(userId)).resolves.toEqual([{ id: 'current', type: 'cv', text: 'Python SQL' }]);
    expect(cvs.getFileById).toHaveBeenCalledExactlyOnceWith(userId, 'current');
    expect(extractor.extract).toHaveBeenCalledWith(content, 'application/pdf');
  });

  it.each(['image/png', 'image/jpeg', 'application/pdf'])('extracts certification %s content with ownership checks', async (mimeType) => {
    certifications.findDocumentIds.mockResolvedValue(new Set(['c1', 'c2']));
    const content = Buffer.from('certificate');
    certifications.getFile.mockResolvedValue({ content, mimeType });
    extractor.extract.mockResolvedValue('React');
    await expect(service.findTextSources(userId)).resolves.toEqual([
      { id: 'c1', type: 'certification', text: 'React' },
      { id: 'c2', type: 'certification', text: 'React' },
    ]);
    expect(certifications.getFile).toHaveBeenNthCalledWith(1, userId, 'c1');
    expect(certifications.getFile).toHaveBeenNthCalledWith(2, userId, 'c2');
    expect(extractor.extract).toHaveBeenCalledWith(content, mimeType);
  });

  it('rejects unreadable documents instead of treating them as empty evidence', async () => {
    certifications.findDocumentIds.mockResolvedValue(new Set(['c1']));
    certifications.getFile.mockResolvedValue({ content: Buffer.from('bad'), mimeType: 'image/png' });
    extractor.extract.mockRejectedValue(new Error('private OCR detail'));
    await expect(service.findTextSources(userId)).rejects.toMatchObject({
      source: { id: 'c1', type: 'certification', reason: 'document-unreadable' },
    });
    await expect(service.findTextSources(userId)).rejects.toBeInstanceOf(NlpDocumentReadException);
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
});
