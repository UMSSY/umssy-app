import { Injectable } from '@nestjs/common';
import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';

@Injectable()
export class RadarEvidenceSourcesService {
  constructor(
    private readonly repository: RadarEvidenceSourcesRepository,
    private readonly cvs: CvSourcesService,
  ) {}

  findPublicationCvStates(userId: string, context: TransactionContext) {
    return this.repository.findPublicationCvStates(userId, context);
  }

  findCertificateSkills(userId: string) {
    return this.repository.findCertificateSkills(userId);
  }

  async findCurrentCvText(userId: string) {
    const current = await this.cvs.currentCvReference(userId);
    if (!current?.hasDocument) return [];
    return this.repository.findCurrentCvText(userId, current.id);
  }
  findApprovedDocumentSkills(userId: string, context?: TransactionContext) {
    return this.repository.findApprovedDocumentSkills(userId, context);
  }
}
