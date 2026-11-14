import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { Injectable } from '@nestjs/common';
import { RadarCvOwnershipException } from '../exceptions/radar-cv-ownership.exception.js';
import { RadarCvNotFoundException } from '../exceptions/radar-cv-not-found.exception.js';
import { RadarCvRepository } from '../repositories/radar-cv.repository.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { RadarPublicationService } from './radar-publication.service.js';
import { RadarPdfExtractionService } from './radar-pdf-extraction.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';

@Injectable()
export class RadarCvService {
  constructor(
    private readonly repository: RadarCvRepository,
    private readonly access: RadarAccessRepository,
    private readonly nlp: ProfileSkillsAnalysisService,
    private readonly publication: RadarPublicationService,
    private readonly extractor: RadarPdfExtractionService,
    private readonly cvs: CvSourcesService,
    private readonly skills: SkillAnalysisService,
  ) {}
  private async audit(
    userId: string,
    actorId: string | null,
    event: string,
    targetId: string | null,
    details: object = {},
  ) {
    await this.access.recordAudit(userId, actorId, event, targetId, details);
  }
  async ingestCv(
    userId: string,
    cvId: string,
    buffer: Buffer,
    reprocess = false,
  ) {
    const { extractedText, extractionStatus } =
      await this.extractor.extract(buffer);
    const rows = await this.repository.upsertEvidence(
      userId,
      cvId,
      extractedText,
      extractionStatus,
    );
    if (!rows.length) throw new RadarCvOwnershipException();
    await this.audit(
      userId,
      null,
      reprocess ? 'cv.reprocessed' : 'cv.submitted',
      cvId,
      { extractionStatus, textCharacters: extractedText.length },
    );
    await this.nlp.refreshAfterChange(userId);
    await this.publication.recalculate(userId, null);
    const nlp = await this.nlp.getRadarSnapshot(userId);
    return {
      cvId,
      extractionStatus,
      extractedCharacters: extractedText.length,
      reviewStatus: rows[0].review_status,
      nlpStatus: nlp.status,
    };
  }
  async rescanCurrentCv(userId: string) {
    const cv = await this.cvs.currentCv(userId);
    if (!cv?.cvPdfData)
      throw new RadarCvNotFoundException('No hay CV vigente para analizar');
    return this.ingestCv(
      userId,
      cv.id,
      Buffer.from(cv.cvPdfData, 'base64'),
      true,
    );
  }
  async reprocessCv(adminId: string, cvId: string) {
    const cv = await this.cvs.cvById(cvId);
    if (!cv?.cvPdfData) throw new RadarCvNotFoundException();
    const result = await this.ingestCv(
      cv.userId,
      cvId,
      Buffer.from(cv.cvPdfData, 'base64'),
      true,
    );
    await this.audit(cv.userId, adminId, 'cv.admin_reprocessed', cvId, {
      extractionStatus: result.extractionStatus,
    });
    return result;
  }
  async cvRemoved(userId: string, cvId: string) {
    await this.repository.deleteEvidence(userId, cvId);
    await this.skills.removeCvEvidence(userId, cvId);
    await this.audit(userId, userId, 'cv.removed', cvId);
    await this.nlp.refreshAfterChange(userId);
    await this.publication.recalculate(userId, userId);
  }
}

