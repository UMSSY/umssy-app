import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { UserSkillRepository } from '../repositories/user-skill.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const skillId = '33333333-3333-4333-8333-333333333333';
const otherSkillId = '44444444-4444-4444-8444-444444444444';
const detectedSkillId = '55555555-5555-4555-8555-555555555555';
const select = { skill: { select: { id: true, name: true, isCustom: true } } };

describe('UserSkillRepository', () => {
  let repository: UserSkillRepository;
  let userSkill: { findMany: ReturnType<typeof vi.fn> };
  let tx: {
    userSkill: {
      findMany: ReturnType<typeof vi.fn>;
      deleteMany: ReturnType<typeof vi.fn>;
      updateMany: ReturnType<typeof vi.fn>;
      createMany: ReturnType<typeof vi.fn>;
    };
  };
  let transaction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    userSkill = { findMany: vi.fn() };
    tx = {
      userSkill: {
        findMany: vi.fn().mockResolvedValue([]),
        deleteMany: vi.fn(),
        updateMany: vi.fn(),
        createMany: vi.fn(),
      },
    };
    transaction = vi.fn((operation: (client: typeof tx) => unknown) => operation(tx));
    repository = new UserSkillRepository({
      userSkill,
      $transaction: transaction,
    } as unknown as PrismaService);
  });

  it('lists the manual skills of the user ordered by name', async () => {
    const records = [{ skill: { id: skillId, name: 'Python', isCustom: false } }];
    userSkill.findMany.mockResolvedValue(records);

    await expect(repository.findByUserId(userId)).resolves.toBe(records);
    expect(userSkill.findMany).toHaveBeenCalledWith({
      where: { userId, source: 'manual' },
      orderBy: { skill: { name: 'asc' } },
      select,
    });
  });

  it('adds the new manual skills in a single transaction', async () => {
    const records = [{ skill: { id: skillId, name: 'Python', isCustom: false } }];
    userSkill.findMany.mockResolvedValue(records);

    await expect(repository.replaceForUser(userId, [skillId, otherSkillId])).resolves.toBe(records);
    expect(transaction).toHaveBeenCalledOnce();
    expect(tx.userSkill.createMany).toHaveBeenCalledWith({
      data: [
        { userId, skillId, source: 'manual' },
        { userId, skillId: otherSkillId, source: 'manual' },
      ],
      skipDuplicates: true,
    });
    expect(tx.userSkill.deleteMany).not.toHaveBeenCalled();
  });

  it('keeps the detected rows and their data while reconciling the manual list', async () => {
    tx.userSkill.findMany.mockResolvedValue([
      { id: 'row-removed', skillId, source: 'manual', evidenceRefs: [] },
      { id: 'row-supported', skillId: otherSkillId, source: 'manual', evidenceRefs: [{ type: 'education', id: 'e1' }] },
      { id: 'row-detected', skillId: detectedSkillId, source: 'nlp', evidenceRefs: [{ type: 'work-experience', id: 'w1' }] },
    ]);
    userSkill.findMany.mockResolvedValue([]);

    await repository.replaceForUser(userId, [detectedSkillId]);

    expect(tx.userSkill.deleteMany).toHaveBeenCalledWith({ where: { userId, id: { in: ['row-removed'] } } });
    expect(tx.userSkill.updateMany).toHaveBeenCalledWith({
      where: { userId, id: { in: ['row-supported'] } },
      data: { source: 'nlp' },
    });
    expect(tx.userSkill.updateMany).toHaveBeenCalledWith({
      where: { userId, id: { in: ['row-detected'] } },
      data: { source: 'manual' },
    });
    expect(tx.userSkill.createMany).not.toHaveBeenCalled();
  });
});
