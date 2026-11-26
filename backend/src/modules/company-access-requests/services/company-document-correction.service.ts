import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UploadedDocumentFile } from '../../access-requests/types/uploaded-file.types.js';
import { FilesService } from '../../files/services/files.service.js';
import { CompanyAccessRequestsRepository } from '../repositories/company-access-requests.repository.js';
import type {
  CompanyDocumentCorrectionContext,
  CompanyDocumentCorrectionResponse,
} from '../types/company-document-correction.types.js';
import { assertNoRegistrationConflict } from '../utils/assert-no-registration-conflict.js';
import { decodeUploadedFileName } from '../utils/decode-uploaded-file-name.js';
import { CompanyAccessRequestsService } from './company-access-requests.service.js';

@Injectable()
export class CompanyDocumentCorrectionService {
  constructor(
    private readonly repository: CompanyAccessRequestsRepository,
    private readonly filesService: FilesService,
    private readonly requestsService: CompanyAccessRequestsService,
  ) {}

  async resubmit(
    context: CompanyDocumentCorrectionContext,
    file: UploadedDocumentFile | undefined,
  ): Promise<CompanyDocumentCorrectionResponse> {
    if (!file) {
      throw new BadRequestException(
        'Debes adjuntar la carta de solicitud en hoja membretada',
      );
    }

    const current = await this.repository.findById(context.requestId);
    if (!current) {
      throw new NotFoundException('Solicitud de empresa no encontrada');
    }

    const duplicates = await this.repository.findDuplicates(
      current.companyName,
      current.email,
      current.username,
      current.id,
    );
    assertNoRegistrationConflict(duplicates, current);

    const result = await this.repository.replaceDocumentAndReopen({
      context,
      createFile: (tx) =>
        this.filesService.create(
          {
            name: decodeUploadedFileName(file.originalname),
            content: file.buffer,
          },
          tx,
        ),
    });

    if (context.previousFileId) {
      await this.deletePreviousFile(context.previousFileId);
    }
    void this.requestsService.evaluateLetterheadOcr(context.requestId);

    return result;
  }

  private async deletePreviousFile(fileId: string): Promise<void> {
    try {
      await this.filesService.delete(fileId);
    } catch {}
  }
}
