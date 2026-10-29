import { Injectable } from '@nestjs/common';
import { AuditEventRecorderService } from '../../audit-events/services/audit-event-recorder.service.js';
import { FilesService } from '../../files/services/files.service.js';
import { InvalidDocumentTypeException, MissingDocumentFileException } from '../exceptions/index.js';
import { decodeUploadFileName } from '../helpers/decode-upload-file-name.js';
import { toDocumentReplacedAuditEvent } from '../mappers/access-request-audit-event.mapper.js';
import { DocumentCorrectionRepository } from '../repositories/document-correction.repository.js';
import { DocumentValidationRepository } from '../repositories/document-validation.repository.js';
import { ACCESS_REQUEST_DOCUMENT_TYPE } from '../types/access-request.enum.js';
import type { DocumentCorrectionContext } from '../types/document-correction.types.js';
import type { AttachDocumentInput } from '../types/uploaded-file.types.js';

@Injectable()
export class DocumentCorrectionService {
  constructor(
    private readonly repository: DocumentCorrectionRepository,
    private readonly files: FilesService,
    private readonly audit: AuditEventRecorderService,
    private readonly validation: DocumentValidationRepository,
  ) {}

  async resubmit(context: DocumentCorrectionContext, input: AttachDocumentInput) {
    const { file, documentType } = input;
    if (!file) throw new MissingDocumentFileException();
    if (!documentType || !Object.values<string>(ACCESS_REQUEST_DOCUMENT_TYPE).includes(documentType)) {
      throw new InvalidDocumentTypeException();
    }

    return this.repository.replaceRejectedDocument({
      context,
      documentType,
      createFile: (tx) => this.files.create({ name: decodeUploadFileName(file.originalname), content: file.buffer }, tx),
      onReplaced: async (previous, created, tx) => {
        await this.audit.record(toDocumentReplacedAuditEvent(previous, created.id), tx);
        await this.validation.queue(context.accessRequestId, tx);
      },
    });
  }
}
