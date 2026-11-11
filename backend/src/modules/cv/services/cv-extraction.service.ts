import { Injectable } from '@nestjs/common';
import { RadarPdfExtractionService } from '../../radar-integration/services/radar-pdf-extraction.service.js';
import { CvExtractionFailedException } from '../exceptions/cv-extraction-failed.exception.js';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import { CvUnreadableException } from '../exceptions/cv-unreadable.exception.js';
import { CvExtractionMapper } from '../mappers/cv-extraction.mapper.js';
import type { CvExtractionResponse } from '../responses/cv-extraction.response.js';
import { CvFileStorage } from '../types/cv-file-storage.type.js';

@Injectable()
export class CvExtractionService {
  constructor(
    private readonly cvFileStorage: CvFileStorage,
    private readonly pdfExtraction: RadarPdfExtractionService,
    private readonly cvExtractionMapper: CvExtractionMapper,
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

    return this.cvExtractionMapper.toResponse(cvId, extractedText);
  }
}
