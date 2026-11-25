import { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';

@Injectable()
export class RadarEvidenceSourcesService {
  constructor(
    private readonly repository: RadarEvidenceSourcesRepository,
    private readonly cvs: CvSourcesService,
  ) {}

  findLatestScores(userId: string): Promise<unknown> {
    return this.repository.findLatestScores(userId);
  }

  findPublicationCvStates(userId: string, context: TransactionContext) {
    return this.repository.findPublicationCvStates(userId, context);
  }

  findUnapprovedCertificateIds(userId: string, context: TransactionContext) {
    return this.repository.findUnapprovedCertificateIds(userId, context);
  }

  findApprovedDocuments(userId: string, context: TransactionContext) {
    return this.repository.findApprovedDocuments(userId, context);
  }

  findCertificateSkills(userId: string) {
    return this.repository.findCertificateSkills(userId);
  }

  async findCurrentCvText(userId: string) {
    const current = await this.cvs.currentCvMetadata(userId);
    return current ? this.repository.findCurrentCvText(userId, current.id) : [];
  }
}
