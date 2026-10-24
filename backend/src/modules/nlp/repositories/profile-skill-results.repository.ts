import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { USER_SKILL_SOURCES, USER_SKILL_VERIFICATION_STATUSES } from '../../skills/constants/user-skill.constants.js';
import { NLP_PROCESSING_STATUSES } from '../constants/nlp-processing.constants.js';
import type { NlpDetectedSkill } from '../types/nlp-detected-skill.type.js';
import type { NlpEvidenceRef } from '../types/nlp-evidence-ref.type.js';
import type { NlpPublishResult } from '../types/nlp-publish-result.type.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
import type { ProfileSkillRow } from '../types/profile-skill-row.type.js';
import { planSkillReconciliation } from '../utils/plan-skill-reconciliation.js';
import { toErrorCode } from '../utils/to-error-code.js';

const UNIQUE_CONSTRAINT_VIOLATION = 'P2002';

export const processingStateSelect = {
  userId: true,
  status: true,
  inputRevision: true,
  processedRevision: true,
  resultVersion: true,
  updatedAt: true,
  dictionaryVersion: true,
} as const;

export const profileSkillRowSelect = {
  id: true,
  skillId: true,
  source: true,
  verificationStatus: true,
  isHighRelevance: true,
  evidenceRefs: true,
  skill: { select: { name: true, areaId: true } },
} as const;

const toJson = (refs: readonly NlpEvidenceRef[]) => refs.map((ref) => ({ type: ref.type, id: ref.id }));

@Injectable()
export class ProfileSkillResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findState(userId: string): Promise<ProfileSkillProcessingState | null> {
    return this.prisma.profileSkillProcessingState.findUnique({
      where: { userId },
      select: processingStateSelect,
    });
  }

  findProfileSkillRows(userId: string): Promise<ProfileSkillRow[]> {
    return this.prisma.userSkill.findMany({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select: profileSkillRowSelect,
    });
  }

  // Each change of skills, work experience or education is a new input revision. Two first changes at the same
  // time can both try to create the row; the one that loses retries and increments the row the other created.
  async registerSourceChange(userId: string, now: Date): Promise<ProfileSkillProcessingState> {
    const upsert = () =>
      this.prisma.profileSkillProcessingState.upsert({
        where: { userId },
        create: { userId, status: NLP_PROCESSING_STATUSES.pending, inputRevision: 1, updatedAt: now },
        update: { status: NLP_PROCESSING_STATUSES.pending, inputRevision: { increment: 1 }, updatedAt: now },
        select: processingStateSelect,
      });
    try {
      return await upsert();
    } catch (error) {
      if (toErrorCode(error) !== UNIQUE_CONSTRAINT_VIOLATION) throw error;
      return upsert();
    }
  }

  ensureState(userId: string, now: Date): Promise<ProfileSkillProcessingState> {
    return this.prisma.profileSkillProcessingState.upsert({
      where: { userId },
      create: { userId, status: NLP_PROCESSING_STATUSES.pending, inputRevision: 0, updatedAt: now },
      update: {},
      select: processingStateSelect,
    });
  }

  async markError(userId: string, revision: number, now: Date): Promise<void> {
    await this.prisma.profileSkillProcessingState.updateMany({
      where: { userId, inputRevision: revision },
      data: { status: NLP_PROCESSING_STATUSES.error, updatedAt: now },
    });
  }

  // Publishes only when the revision is still the current one; the update locks the state row, so a result
  // computed from older data can never replace a newer one. Returns null for a stale result.
  publish(
    userId: string,
    revision: number,
    detected: readonly NlpDetectedSkill[],
    dictionaryVersion: string,
    now: Date,
  ): Promise<NlpPublishResult | null> {
    return this.prisma.$transaction(async (tx) => {
      const claimed = await tx.profileSkillProcessingState.updateMany({
        where: { userId, inputRevision: revision },
        data: { updatedAt: now },
      });
      if (claimed.count === 0) return null;

      const previous = await tx.profileSkillProcessingState.findUnique({
        where: { userId },
        select: { processedRevision: true },
      });
      const rows = await tx.userSkill.findMany({ where: { userId }, select: profileSkillRowSelect });
      const plan = planSkillReconciliation(rows, detected);

      if (plan.deleteIds.length > 0) {
        await tx.userSkill.deleteMany({ where: { userId, id: { in: plan.deleteIds } } });
      }
      for (const update of plan.updates) {
        await tx.userSkill.update({
          where: { id: update.id },
          data: { evidenceRefs: toJson(update.evidenceRefs), isHighRelevance: update.isHighRelevance },
        });
      }
      if (plan.creates.length > 0) {
        await tx.userSkill.createMany({
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

      const changed = plan.creates.length + plan.updates.length + plan.deleteIds.length > 0;
      const isFirstResult = previous?.processedRevision === null;
      const state = await tx.profileSkillProcessingState.update({
        where: { userId },
        data: {
          status: NLP_PROCESSING_STATUSES.ready,
          processedRevision: revision,
          dictionaryVersion,
          updatedAt: now,
          ...(changed || isFirstResult ? { resultVersion: { increment: 1 } } : {}),
        },
        select: processingStateSelect,
      });
      return { state, changed };
    });
  }
}
