import { BadRequestException, Injectable } from '@nestjs/common';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { CertificationDocumentsService } from '../../certification-documents/services/certification-documents.service.js';
import type { CertificationDocumentData } from '../../certification-documents/types/certification-document-data.type.js';
import { CertificationNotFoundException } from '../exceptions/certification-not-found.exception.js';
import { ProfileSkillsAnalysisService } from '../../nlp/services/profile-skills-analysis.service.js';
import { CertificationMapper } from '../mappers/certification.mapper.js';
import { CertificationDocumentsRepository } from '../../certification-documents/repositories/certification-documents.repository.js';
import { CertificationsRepository } from '../repositories/certifications.repository.js';
import type { CreateCertificationRequest } from '../requests/create-certification.request.js';
import type { UpdateCertificationRequest } from '../requests/update-certification.request.js';
import type { CertificationRecord } from '../types/certification-record.type.js';
import type { CertificationResponse } from '../types/certification-response.type.js';

@Injectable()
export class CertificationsService {
  constructor(
    private readonly certificationsRepository: CertificationsRepository,
    private readonly documentsRepository: CertificationDocumentsRepository,
    private readonly certificationMapper: CertificationMapper,
    private readonly skillsAnalysis: ProfileSkillsAnalysisService,
    private readonly documents: CertificationDocumentsService,
  ) {}

  async saveWithDocument(
    userId: string,
    id: string | null,
    request: CreateCertificationRequest,
    action: 'replace' | 'remove' | 'keep',
    file: MulterFile | undefined,
  ): Promise<CertificationResponse> {
    if (id) await this.getOwnedOrFail(userId, id);
    if (!id && action !== 'replace') throw new BadRequestException('Adjunta el respaldo de la certificación.');
    if (file && action !== 'replace') throw new BadRequestException('La acción no corresponde al archivo enviado.');
    let document: CertificationDocumentData | undefined;
    if (action === 'replace') {
      const prepared = this.documents.prepare(file);
      document = { documentUrl: new Uint8Array(prepared.content), ...prepared.metadata };
    } else if (action === 'remove') {
      document = { documentUrl: null, documentFileName: null, documentMimeType: null, documentSizeBytes: null, documentUploadedAt: null };
    }
    // Certification fields, file bytes and the audit receipt commit in one transaction.
    const saved = id
      ? await this.certificationsRepository.update(id, request, document)
      : await this.certificationsRepository.create(userId, request, document);
    const hasDocument = document ? document.documentUrl !== null : await this.documentsRepository.hasDocument(saved.id);
    await this.skillsAnalysis.refreshAfterChange(userId);
    return this.certificationMapper.toResponse(saved, hasDocument);
  }

  async create(
    userId: string,
    request: CreateCertificationRequest,
  ): Promise<CertificationResponse> {
    const created = await this.certificationsRepository.create(userId, request);
    await this.skillsAnalysis.refreshAfterChange(userId);
    return this.certificationMapper.toResponse(created);
  }

  async findAll(userId: string): Promise<CertificationResponse[]> {
    const [records, idsWithDocument] = await Promise.all([
      this.certificationsRepository.findManyByUserId(userId),
      this.documentsRepository.findIdsWithDocument(userId),
    ]);
    return this.certificationMapper.toResponseList(records, idsWithDocument);
  }

  async update(
    userId: string,
    id: string,
    request: UpdateCertificationRequest,
  ): Promise<CertificationResponse> {
    await this.getOwnedOrFail(userId, id);
    const updated = await this.certificationsRepository.update(id, request);
    const hasDocument = await this.documentsRepository.hasDocument(id);
    await this.skillsAnalysis.refreshAfterChange(userId);
    return this.certificationMapper.toResponse(updated, hasDocument);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getOwnedOrFail(userId, id);
    await this.certificationsRepository.delete(id);
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
