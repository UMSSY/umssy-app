import { Injectable } from '@nestjs/common';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { NLP_PROCESSING_STATUSES } from '../constants/nlp-processing.constants.js';
import type { NlpPublishResult } from '../types/nlp-publish-result.type.js';
import type { ProfileSkillProcessingState } from '../types/profile-skill-processing-state.type.js';
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

@Injectable()
export class ProfileSkillResultsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findState(userId: string): Promise<ProfileSkillProcessingState | null> {
    return this.prisma.profileSkillProcessingState.findUnique({
      where: { userId },
      select: processingStateSelect,
    });
  }

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

  publish(
    userId: string,
    revision: number,
    dictionaryVersion: string,
    now: Date,
    reconcileSkills: (context: TransactionContext) => Promise<boolean>,
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
      const changed = await reconcileSkills({ client: tx });
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
