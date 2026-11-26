import { Injectable } from '@nestjs/common';
import { SkillDetectionService } from '../../nlp/services/skill-detection.service.js';
import { SkillValidationService } from '../../nlp/services/skill-validation.service.js';
import { CityCatalogService } from '../../profile/services/city-catalog.service.js';
import { RadarPdfExtractionService } from '../../radar-integration/services/radar-pdf-extraction.service.js';
import { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import { CV_SKILL_SOURCE_TYPE } from '../constants/cv-extraction.constants.js';
import { CvExtractionFailedException } from '../exceptions/cv-extraction-failed.exception.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import { CvUnreadableException } from '../exceptions/cv-unreadable.exception.js';
import { CvExtractionMapper } from '../mappers/cv-extraction.mapper.js';
import type { CvExtractedSkillResponse } from '../responses/cv-extracted-skill.response.js';
import type { CvExtractionResponse } from '../responses/cv-extraction.response.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

@Injectable()
export class CvExtractionService {
  constructor(
    private readonly cvFileStorage: CvFileStorage,
    private readonly pdfExtraction: RadarPdfExtractionService,
    private readonly cvExtractionMapper: CvExtractionMapper,
    private readonly skillDetection: SkillDetectionService,
    private readonly skillValidation: SkillValidationService,
    private readonly skillAnalysis: SkillAnalysisService,
    private readonly cityCatalog: CityCatalogService,
  ) {}

  async extract(userId: string, cvId: string): Promise<CvExtractionResponse> {
    const content = await this.cvFileStorage.readById(userId, cvId);

    if (!content) {
      throw new CvNotFoundException();
    }

    const { extractedText, extractionStatus } =
      await this.pdfExtraction.extract(content);

    if (extractionStatus === 'error') {
      throw new CvExtractionFailedException();
    }

    if (extractionStatus === 'unreadable') {
      throw new CvUnreadableException();
    }

    const [skills, cities] = await Promise.all([
      this.detectSkills(userId, cvId, extractedText),
      this.cityCatalog.listCities(),
    ]);

    return this.cvExtractionMapper.toResponse(cvId, extractedText, {
      skills,
      cities,
    });
  }

  private async detectSkills(
    userId: string,
    cvId: string,
    text: string,
  ): Promise<CvExtractedSkillResponse[]> {
    const catalog = await this.skillAnalysis.findCatalog();
    const candidates = this.skillDetection.detect(
      { userId, sources: [{ id: cvId, type: CV_SKILL_SOURCE_TYPE, text }] },
      catalog,
    );
    return this.skillValidation
      .validateDetected(candidates, catalog)
      .accepted.map(({ id, name }) => ({ skillId: id, name }));
  }
}
