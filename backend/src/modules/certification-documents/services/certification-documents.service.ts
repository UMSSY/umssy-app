import { Injectable } from '@nestjs/common';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { CertificationNotFoundException } from '../../certifications/exceptions/certification-not-found.exception.js';
import { CertificationMapper } from '../../certifications/mappers/certification.mapper.js';
import { CertificationsRepository } from '../../certifications/repositories/certifications.repository.js';
import type { CertificationRecord } from '../../certifications/types/certification-record.type.js';
import type { CertificationResponse } from '../../certifications/types/certification-response.type.js';
import { CERTIFICATION_DOCUMENT_VALIDATION_RULES } from '../constants/certification-document.constants.js';
import { CertificationDocumentNotFoundException } from '../exceptions/certification-document-not-found.exception.js';
import { CertificationDocumentMapper } from '../mappers/certification-document.mapper.js';
import { CertificationDocumentsRepository } from '../repositories/certification-documents.repository.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import type { CertificationDocumentDownload } from '../types/certification-document-download.type.js';
import type { CertificationDocumentMetadata } from '../types/certification-document-metadata.type.js';

@Injectable()
export class CertificationDocumentsService {
  constructor(
    private readonly certificationsRepository: CertificationsRepository,
    private readonly documentsRepository: CertificationDocumentsRepository,
    private readonly fileValidationService: FileValidationService,
    private readonly certificationMapper: CertificationMapper,
    private readonly documentMapper: CertificationDocumentMapper,
    private readonly skillsAnalysis: ProfileSkillsAnalysisService,
  ) {}

  prepare(file: MulterFile | undefined): { content: Buffer; metadata: CertificationDocumentMetadata } {
    const validated = this.fileValidationService.validate(
      file ? this.documentMapper.toUploadedFile(file) : undefined,
      CERTIFICATION_DOCUMENT_VALIDATION_RULES,
    );
    return {
      content: validated.buffer,
      metadata: {
        documentFileName: (file?.originalname.split(/[\\/]/).at(-1) || 'respaldo').slice(0, 255),
        documentMimeType: validated.detectedMimeType,
        documentSizeBytes: validated.buffer.length,
        documentUploadedAt: new Date(),
      },
    };
  }

  async upload(
    userId: string,
    id: string,
    file: MulterFile | undefined,
  ): Promise<CertificationResponse> {
    await this.getOwnedOrFail(userId, id);

    const prepared = this.prepare(file);
    await this.documentsRepository.save(id, prepared.content, prepared.metadata);
    await this.skillsAnalysis.refreshAfterChange(userId);

    const updated = await this.getOwnedOrFail(userId, id);
    return this.certificationMapper.toResponse(updated, true);
  }

  async getFile(
    userId: string,
    id: string,
  ): Promise<CertificationDocumentDownload> {
    await this.getOwnedOrFail(userId, id);
    const content = await this.documentsRepository.read(id);

    if (!content) {
      throw new CertificationDocumentNotFoundException();
    }

    return this.documentMapper.toFileDownload(
      id,
      content,
      this.fileValidationService.detectMimeType(content),
    );
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedOrFail(userId, id);

    if (!(await this.documentsRepository.hasDocument(id))) {
      throw new CertificationDocumentNotFoundException();
    }

    await this.documentsRepository.remove(id);
    await this.skillsAnalysis.refreshAfterChange(userId);
  }

  private async getOwnedOrFail(
    userId: string,
    id: string,
  ): Promise<CertificationRecord> {
    const record = await this.certificationsRepository.findById(id);

    if (!record || record.userId !== userId) {
      throw new CertificationNotFoundException();
    }

    return record;
  }
}
