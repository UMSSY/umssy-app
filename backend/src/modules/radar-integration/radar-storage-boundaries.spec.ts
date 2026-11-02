import { describe, expect, it, vi } from 'vitest';
import type { ProfileSkillsAnalysisService } from '../nlp/services/profile-skills-analysis.service.js';
import { RadarCvService } from './radar-cv.service.js';
import { RadarReviewService } from './radar-review.service.js';
import type { RadarPublicationService } from './radar-publication.service.js';
import type { RadarPdfExtractionService } from './radar-pdf-extraction.service.js';
import type { RadarAccessRepository } from './repositories/radar-access.repository.js';
import type { RadarCvRepository } from './repositories/radar-cv.repository.js';
import type { RadarReviewRepository } from './repositories/radar-review.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const adminId = '22222222-2222-4222-8222-222222222222';
const cvId = '33333333-3333-4333-8333-333333333333';

function setup() {
  const access = {
    hasRole: vi.fn().mockResolvedValue(true),
    recordAudit: vi.fn().mockResolvedValue(undefined),
  };
  const cvStorage = {
    upsertEvidence: vi.fn().mockResolvedValue([{ review_status: 'approved' }]),
    currentCv: vi.fn(),
    cvById: vi.fn(),
  };
  const reviews = {
    listReviewQueue: vi.fn().mockResolvedValue([[], []]),
    changeCvDecision: vi.fn(),
    cvOwner: vi.fn(),
    skillForDecision: vi.fn(),
    changeSkillDecision: vi.fn(),
    cvForAdmin: vi.fn(),
  };
  const nlp = {
    refreshAfterChange: vi.fn().mockResolvedValue(undefined),
    getRadarSnapshot: vi.fn().mockResolvedValue({ status: 'ready' }),
  };
  const publication = {
    recalculate: vi.fn().mockResolvedValue(null),
    myRadar: vi.fn().mockResolvedValue({ status: 'published' }),
  };
  const extractor = {
    extract: vi.fn().mockResolvedValue({ extractedText: 'texto de prueba', extractionStatus: 'ready' }),
  };
  const cv = new RadarCvService(
    cvStorage as unknown as RadarCvRepository,
    access as unknown as RadarAccessRepository,
    nlp as unknown as ProfileSkillsAnalysisService,
    publication as unknown as RadarPublicationService,
    extractor as unknown as RadarPdfExtractionService,
  );
  const review = new RadarReviewService(
    reviews as unknown as RadarReviewRepository,
    access as unknown as RadarAccessRepository,
    nlp as unknown as ProfileSkillsAnalysisService,
    publication as unknown as RadarPublicationService,
  );
  return { access, cvStorage, reviews, nlp, publication, extractor, cv, review };
}

describe('Radar storage boundaries: CV and administrative review', () => {
  it('does not reset a previous CV approval when rescanning its evidence', async () => {
    const { cv, cvStorage, publication, nlp } = setup();
    const result = await cv.ingestCv(userId, cvId, Buffer.from('fake pdf'), true);
    expect(cvStorage.upsertEvidence).toHaveBeenCalledWith(userId, cvId, 'texto de prueba', 'ready');
    expect(result.reviewStatus).toBe('approved');
    expect(nlp.refreshAfterChange).toHaveBeenCalledWith(userId);
    expect(publication.recalculate).toHaveBeenCalledWith(userId, null);
  });

  it('denies an administrative CV reprocess before reading the document', async () => {
    const { cv, access, cvStorage } = setup();
    access.hasRole.mockResolvedValue(false);
    await expect(cv.reprocessCv(adminId, cvId)).rejects.toThrow('Se requiere rol administrativo');
    expect(cvStorage.cvById).not.toHaveBeenCalled();
  });

  it('rejects a review decision from a user without administrative role', async () => {
    const { review, access, reviews } = setup();
    access.hasRole.mockResolvedValue(false);
    await expect(review.decision(userId, 'cv', cvId, 'approved')).rejects.toThrow('Se requiere rol administrativo');
    expect(reviews.changeCvDecision).not.toHaveBeenCalled();
  });

  it('keeps review idempotent when the evidence already has the requested status', async () => {
    const { review, reviews, publication, access, nlp } = setup();
    reviews.changeCvDecision.mockResolvedValue([]);
    reviews.cvOwner.mockResolvedValue([{ user_id: userId }]);
    const result = await review.decision(adminId, 'cv', cvId, 'approved');
    expect(result).toEqual({ status: 'published' });
    expect(publication.recalculate).toHaveBeenCalledWith(userId, adminId);
    expect(nlp.refreshAfterChange).not.toHaveBeenCalled();
    expect(access.recordAudit).not.toHaveBeenCalled();
  });
});
