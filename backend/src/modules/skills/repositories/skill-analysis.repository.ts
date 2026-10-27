import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { USER_SKILL_SOURCES, USER_SKILL_VERIFICATION_STATUSES } from '../constants/user-skill.constants.js';
import type { ProfileSkillRowResponse } from '../responses/profile-skill-row.response.js';
import type { SkillAnalysisCatalogResponse } from '../responses/skill-analysis-catalog.response.js';
import type { SkillEvidenceRefPayload } from '../types/skill-evidence-ref-payload.type.js';
import type { SkillReconciliationPayload } from '../types/skill-reconciliation-payload.type.js';

export const profileSkillRowSelect = {
  id: true,
  skillId: true,
  source: true,
  verificationStatus: true,
  isHighRelevance: true,
  evidenceRefs: true,
  skill: { select: { name: true, areaId: true } },
} as const;

const toJson = (refs: readonly SkillEvidenceRefPayload[]) => refs.map((ref) => ({ type: ref.type, id: ref.id }));

@Injectable()
export class SkillAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  findCatalog(): Promise<SkillAnalysisCatalogResponse[]> {
    return this.prisma.skill.findMany({
      where: { isCustom: false },
      select: { id: true, name: true, areaId: true },
    });
  }

  findProfileSkillRows(userId: string, context?: TransactionContext): Promise<ProfileSkillRowResponse[]> {
    const client = context?.client ?? this.prisma;
    return client.userSkill.findMany({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select: profileSkillRowSelect,
    });
  }

  async applyReconciliation(userId: string, plan: SkillReconciliationPayload, context: TransactionContext): Promise<void> {
    const client = context.client;
    if (plan.deleteIds.length > 0) {
      await client.userSkill.deleteMany({ where: { userId, id: { in: plan.deleteIds } } });
    }
    for (const update of plan.updates) {
      await client.userSkill.update({
        where: { id: update.id, userId },
        data: { evidenceRefs: toJson(update.evidenceRefs), isHighRelevance: update.isHighRelevance },
      });
    }
    if (plan.creates.length > 0) {
      await client.userSkill.createMany({
        data: plan.creates.map((create) => ({
          userId,
          skillId: create.skillId,
          source: USER_SKILL_SOURCES.nlp,
          verificationStatus: USER_SKILL_VERIFICATION_STATUSES.pending,
          isHighRelevance: true,
          evidenceRefs: toJson(create.evidenceRefs),
        })),
        skipDuplicates: true,
      });
    }
  }
}
