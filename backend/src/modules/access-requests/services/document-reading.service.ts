import { Injectable, Logger } from '@nestjs/common';
import { FilesService } from '../../files/services/files.service.js';
import { parseDocumentReading } from '../helpers/parse-document-reading.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { AutomaticValidationService } from './automatic-validation.service.js';
import { DocumentTextExtractorService } from './document-text-extractor.service.js';

@Injectable()
export class DocumentReadingService {
  private readonly logger = new Logger(DocumentReadingService.name);

  constructor(
    private readonly documentValidationRepository: DocumentValidationRepository,
    private readonly filesService: FilesService,
    private readonly textExtractor: DocumentTextExtractorService,
    private readonly automaticValidation: AutomaticValidationService,
  ) {}

  // Lee el documento real de la solicitud y entrega la lectura a la validación automática (HU 1.5.3)
  async readAndEvaluate(accessRequestId: string, now: Date = new Date()) {
    const state = await this.documentValidationRepository.findAutomationState(accessRequestId);
    if (!state?.documentFileId) {
      this.logger.warn(`La solicitud ${accessRequestId} no tiene documento para leer`);
      return null;
    }
    const file = await this.filesService.getContent(state.documentFileId);
    const text = await this.textExtractor.extract(file);
    const reading = parseDocumentReading(
      text,
      { firstName: state.firstName, lastName: state.lastName, career: state.career.title, graduationYear: state.graduationYear },
      now.getFullYear(),
    );
    return this.automaticValidation.evaluateReading(accessRequestId, reading, now);
  }

  // Se llama después de enviar la solicitud: no bloquea la respuesta; si falla, la solicitud queda para revisión manual
  scheduleReading(accessRequestId: string) {
    setImmediate(() => {
      this.readAndEvaluate(accessRequestId).catch((error: unknown) => {
        this.logger.error(`No se pudo leer el documento de la solicitud ${accessRequestId}`, error instanceof Error ? error.stack : String(error));
      });
    });
  }
}

