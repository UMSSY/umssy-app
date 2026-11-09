import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';

@Injectable()
export class RadarEvidenceSourcesService {
  constructor(private readonly repository: RadarEvidenceSourcesRepository) {}

  findPublicationCvStates(userId: string, context: TransactionContext) {
    return this.repository.findPublicationCvStates(userId, context);
  }

  findCurrentCvText(userId: string) {
    return this.repository.findCurrentCvText(userId);
  }
}
