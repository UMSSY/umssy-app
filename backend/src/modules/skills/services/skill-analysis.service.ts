import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { SkillAnalysisRepository } from '../repositories/skill-analysis.repository.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { SkillAnalysisCatalogResponse } from '../responses/skill-analysis-catalog.response.js';
import type { DetectedSkillPayload } from '../types/detected-skill-payload.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';

@Injectable()
export class SkillAnalysisService {
  constructor(private readonly repository: SkillAnalysisRepository) {}

  findCatalog(): Promise<SkillAnalysisCatalogResponse[]> {
    return this.repository.findCatalog();
  }

  findProfileSkillRows(userId: string): Promise<ProfileSkillRowResponse[]> {
    return this.repository.findProfileSkillRows(userId);
  }

  async reconcileDetected(userId: string, detected: readonly DetectedSkillPayload[], context: TransactionContext): Promise<boolean> {
    const rows = await this.repository.findProfileSkillRows(userId, context);
    const plan = planSkillReconciliation(rows, detected);
    await this.repository.applyReconciliation(userId, plan, context);
    return plan.creates.length + plan.updates.length + plan.deleteIds.length > 0;
  }
}
