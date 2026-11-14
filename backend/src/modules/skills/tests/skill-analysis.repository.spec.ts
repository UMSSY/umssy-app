import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { TransactionContext } from '../../../common/types/transaction-context.types.js';
import {
  SkillAnalysisRepository,
  profileSkillRowSelect,
} from '../repositories/skill-analysis.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';

describe('SkillAnalysisRepository', () => {
  const prisma = {
    skill: { findMany: vi.fn() },
    userSkill: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
  };
  const client = {
    userSkill: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
      createMany: vi.fn(),
    },
  };
  const context = { client } as unknown as TransactionContext;
  const repository = new SkillAnalysisRepository(
    prisma as unknown as PrismaService,
  );

  beforeEach(() => vi.resetAllMocks());

  it('restricts the analysis catalog to official skills', async () => {
    prisma.skill.findMany.mockResolvedValue([]);
    await repository.findCatalog();
    expect(prisma.skill.findMany).toHaveBeenCalledWith({
      where: { isCustom: false },
      select: { id: true, name: true, areaId: true },
    });
  });

  it('reads owner rows outside a transaction for radar snapshots', async () => {
    await repository.findProfileSkillRows(userId);
    expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select: profileSkillRowSelect,
    });
  });

  it('reads and writes through the supplied publishing transaction', async () => {
    await repository.findProfileSkillRows(userId, context);
    const evidenceRefs = [{ type: 'education' as const, id: 'e1' }];
    await repository.applyReconciliation(
      userId,
      {
        creates: [{ skillId: 'new', evidenceRefs }],
        updates: [{ id: 'manual-row', evidenceRefs, isHighRelevance: true }],
        deleteIds: ['old-row'],
      },
      context,
    );

    expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
    expect(client.userSkill.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select: profileSkillRowSelect,
    });
    expect(client.userSkill.deleteMany).toHaveBeenCalledWith({
      where: { userId, id: { in: ['old-row'] } },
    });
    expect(client.userSkill.update).toHaveBeenCalledWith({
      where: { id: 'manual-row', userId },
      data: { evidenceRefs, isHighRelevance: true },
    });
    expect(client.userSkill.createMany).toHaveBeenCalledWith({
      data: [
        {
          userId,
          skillId: 'new',
          source: 'nlp',
          verificationStatus: 'pending',
          isHighRelevance: true,
          evidenceRefs,
        },
      ],
      skipDuplicates: true,
    });
  });

  it('performs no writes for an unchanged plan', async () => {
    await repository.applyReconciliation(
      userId,
      { creates: [], updates: [], deleteIds: [] },
      context,
    );
    expect(client.userSkill.deleteMany).not.toHaveBeenCalled();
    expect(client.userSkill.update).not.toHaveBeenCalled();
    expect(client.userSkill.createMany).not.toHaveBeenCalled();
  });

  it('deletes nlp skills when their only evidence was from the deleted cv', async () => {
    prisma.userSkill.findMany.mockResolvedValue([
      {
        id: 'nlp-skill',
        source: 'nlp',
        evidenceRefs: [{ type: 'cv', id: 'cv-1' }],
      },
    ]);
    await repository.removeCvEvidence(userId, 'cv-1');
    expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
      where: { userId, id: { in: ['nlp-skill'] } },
    });
    expect(prisma.userSkill.update).not.toHaveBeenCalled();
  });

  it('updates evidenceRefs and retains relevance when skill has remaining evidence', async () => {
    prisma.userSkill.findMany.mockResolvedValue([
      {
        id: 'nlp-multi',
        source: 'nlp',
        evidenceRefs: [
          { type: 'cv', id: 'cv-1' },
          { type: 'education', id: 'edu-1' },
        ],
      },
    ]);
    await repository.removeCvEvidence(userId, 'cv-1');
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSkill.update).toHaveBeenCalledWith({
      where: { id: 'nlp-multi' },
      data: {
        evidenceRefs: [{ type: 'education', id: 'edu-1' }],
        isHighRelevance: true,
      },
    });
  });

  it('retains manual skill when cv evidence is removed', async () => {
    prisma.userSkill.findMany.mockResolvedValue([
      {
        id: 'manual-skill',
        source: 'manual',
        evidenceRefs: [{ type: 'cv', id: 'cv-1' }],
      },
    ]);
    await repository.removeCvEvidence(userId, 'cv-1');
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSkill.update).toHaveBeenCalledWith({
      where: { id: 'manual-skill' },
      data: {
        evidenceRefs: [],
        isHighRelevance: false,
      },
    });
  });

  it('leaves untouched skills that do not match the deleted cv', async () => {
    prisma.userSkill.findMany.mockResolvedValue([
      {
        id: 'other-skill',
        source: 'nlp',
        evidenceRefs: [{ type: 'cv', id: 'cv-other' }],
      },
      {
        id: 'no-refs',
        source: 'manual',
        evidenceRefs: null,
      },
    ]);
    await repository.removeCvEvidence(userId, 'cv-1');
    expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
    expect(prisma.userSkill.update).not.toHaveBeenCalled();
  });
});

