import { describe, expect, it, vi } from 'vitest';
import { RadarCvService } from './radar-cv.service.js';
import { RadarReviewService } from './radar-review.service.js';
import { RadarReviewMapper } from './mappers/radar-review.mapper.js';
import { RadarIntegrationController } from './radar-integration.controller.js';
import { ROLES_KEY } from '../../common/constants/roles.constants.js';
import type { RadarCvRepository } from './repositories/radar-cv.repository.js';
import type { RadarReviewRepository } from './repositories/radar-review.repository.js';
import type { RadarAccessRepository } from './repositories/radar-access.repository.js';
import type { RadarPublicationService } from './radar-publication.service.js';
import type { RadarPdfExtractionService } from './radar-pdf-extraction.service.js';
import type { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';

const owner = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';
const admin = '33333333-3333-4333-8333-333333333333';

function setupCv() {
  const repository = { upsertEvidence: vi.fn().mockResolvedValue([{ review_status: 'approved' }]), currentCv: vi.fn(), cvById: vi.fn() };
  const access = { hasRole: vi.fn().mockResolvedValue(true), recordAudit: vi.fn().mockResolvedValue(undefined) };
  const nlp = { refreshAfterChange: vi.fn().mockResolvedValue(undefined), getRadarSnapshot: vi.fn().mockResolvedValue({ status: 'ready' }) };
  const publication = { recalculate: vi.fn().mockResolvedValue({}) };
  const extractor = { extract: vi.fn().mockResolvedValue({ extractedText: 'Python', extractionStatus: 'ready' }) };
  const service = new RadarCvService(repository as unknown as RadarCvRepository, access as unknown as RadarAccessRepository, nlp as unknown as ProfileSkillsAnalysisService, publication as unknown as RadarPublicationService, extractor as unknown as RadarPdfExtractionService);
  return { repository, access, nlp, publication, extractor, service };
}

function setupReview() {
  const repository = { listReviewQueue: vi.fn().mockResolvedValue([[], []]), changeCvDecision: vi.fn(), cvOwner: vi.fn(), skillForDecision: vi.fn(), changeSkillDecision: vi.fn(), cvForAdmin: vi.fn() };
  const access = { hasRole: vi.fn().mockResolvedValue(true), recordAudit: vi.fn().mockResolvedValue(undefined) };
  const nlp = { refreshAfterChange: vi.fn().mockResolvedValue(undefined) };
  const publication = { recalculate: vi.fn().mockResolvedValue({}), myRadar: vi.fn().mockResolvedValue({ userId: owner }) };
  const service = new RadarReviewService(repository as unknown as RadarReviewRepository, access as unknown as RadarAccessRepository, nlp as unknown as ProfileSkillsAnalysisService, publication as unknown as RadarPublicationService, new RadarReviewMapper());
  return { repository, access, nlp, publication, service };
}

describe('Separación de CV y revisión HU1-HU3', () => {
  it('reprocesa un CV conservando la decisión administrativa almacenada', async () => {
    const { service, repository, access, nlp, publication } = setupCv();
    const result = await service.ingestCv(owner, cvId, Buffer.from('pdf'), true);
    expect(result.reviewStatus).toBe('approved');
    expect(repository.upsertEvidence).toHaveBeenCalledWith(owner, cvId, 'Python', 'ready');
    expect(access.recordAudit).toHaveBeenCalledWith(owner, null, 'cv.reprocessed', cvId, { extractionStatus: 'ready', textCharacters: 6 });
    expect(nlp.refreshAfterChange).toHaveBeenCalledWith(owner);
    expect(publication.recalculate).toHaveBeenCalledWith(owner, null);
  });
  it('no acepta insertar evidencias sobre un CV ajeno', async () => {
    const { service, repository, access } = setupCv();
    repository.upsertEvidence.mockResolvedValueOnce([]);
    await expect(service.ingestCv(owner, cvId, Buffer.from('pdf'))).rejects.toThrow('El CV no pertenece al titular');
    expect(access.recordAudit).not.toHaveBeenCalled();
  });
  it('protege el reprocesamiento y la descarga administrativa con roles', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RadarIntegrationController.prototype.reprocessCv)).toEqual(['administrativo']);
    expect(Reflect.getMetadata(ROLES_KEY, RadarIntegrationController.prototype.download)).toEqual(['administrativo']);
  });
  it('protege la cola y las decisiones con roles administrativos', () => {
    expect(Reflect.getMetadata(ROLES_KEY, RadarIntegrationController.prototype.queue)).toEqual(['administrativo']);
    expect(Reflect.getMetadata(ROLES_KEY, RadarIntegrationController.prototype.decision)).toEqual(['administrativo']);
  });
  it('aprueba habilidades sin perder auditoría ni recálculo publicado', async () => {
    const { service, repository, access, publication } = setupReview();
    repository.skillForDecision.mockResolvedValue({ userId: owner, verificationStatus: 'pending' });
    repository.changeSkillDecision.mockResolvedValue({ count: 1 });
    const result = await service.decision(admin, 'skill', cvId, 'approved');
    expect(result).toEqual({ userId: owner });
    expect(access.recordAudit).toHaveBeenCalledWith(owner, admin, 'skill.approved', cvId, {});
    expect(publication.recalculate).toHaveBeenCalledWith(owner, admin);
  });
  it('audita las visualizaciones administrativas de un CV', async () => {
    const { service, repository, access } = setupReview();
    repository.cvForAdmin.mockResolvedValue({ userId: owner, cvPdfData: Buffer.from('contenido').toString('base64'), cvFileName: 'cv.pdf' });
    const result = await service.downloadForAdmin(admin, cvId);
    expect(result.filename).toBe('cv.pdf');
    expect(result.buffer.toString()).toBe('contenido');
    expect(access.recordAudit).toHaveBeenCalledWith(owner, admin, 'cv.viewed', cvId, {});
  });
});
