import { Injectable, Logger } from '@nestjs/common';
import { FilesService } from '../../files/services/files.service.js';
import { parseDocumentReading } from '../helpers/parse-document-reading.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { VALIDATION_RESULT } from '../types/document-validation.enum.js';
import type { DocumentReading } from '../types/document-reading.types.js';
import { AutomaticValidationService } from './automatic-validation.service.js';
import { DocumentTextExtractorService } from './document-text-extractor.service.js';

@Injectable()
export class DocumentReadingService {
  private readonly logger = new Logger(DocumentReadingService.name);
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly documentValidationRepository: DocumentValidationRepository,
    private readonly filesService: FilesService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly automaticValidation: AutomaticValidationService,
  ) {}

  async readAndEvaluate(accessRequestId: string, now: Date = new Date()) {
    const state = await this.documentValidationRepository.findAutomationState(accessRequestId);
    if (!state?.documentFileId || state.documentValidation?.result !== VALIDATION_RESULT.QUEUED) return null;

    let reading: DocumentReading;
    try {
      const file = await this.filesService.getContent(state.documentFileId);
      const text = await this.textExtractor.extract(file);
      if (!text.text.trim()) throw new Error('OCR returned empty text');
      reading = parseDocumentReading(
        text,
        { firstName: state.firstName, lastName: state.lastName, career: state.career.title, graduationYear: state.graduationYear },
        now.getFullYear(),
      );
    } catch (error) {
      await this.automaticValidation.markOcrFailed(accessRequestId, state.documentFileId, now);
      this.logger.error(
        'No se pudo leer el documento de la solicitud ' + accessRequestId,
        error instanceof Error ? error.stack : String(error),
      );
      return null;
    }

    return this.automaticValidation.evaluateReading(accessRequestId, reading, now, state.documentFileId);
  }

  scheduleReading(accessRequestId: string) {
    setImmediate(() => {
      this.queue = this.queue
        .then(() => this.readAndEvaluate(accessRequestId))
        .catch((error: unknown) => {
          this.logger.error(
            'No se pudo procesar la lectura de la solicitud ' + accessRequestId,
            error instanceof Error ? error.stack : String(error),
          );
        });
    });
  }
}
