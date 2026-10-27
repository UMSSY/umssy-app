import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { UserSkillRepository } from '../repositories/user-skill.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const skillId = '33333333-3333-4333-8333-333333333333';
const otherSkillId = '44444444-4444-4444-8444-444444444444';
const select = { skill: { select: { id: true, name: true, isCustom: true } } };

describe('UserSkillRepository', () => {
  let repository: UserSkillRepository;
  let userSkill: {
    findMany: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    createMany: ReturnType<typeof vi.fn>;
  };
  let transaction: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    userSkill = {
      findMany: vi.fn(),
      deleteMany: vi.fn().mockReturnValue('delete-operation'),
      createMany: vi.fn().mockReturnValue('create-operation'),
    };
    transaction = vi.fn().mockResolvedValue([]);
    repository = new UserSkillRepository({
      userSkill,
      $transaction: transaction,
    } as unknown as PrismaService);
  });

  it('lists the skills of the user ordered by name', async () => {
    const records = [{ skill: { id: skillId, name: 'Python', isCustom: false } }];
    userSkill.findMany.mockResolvedValue(records);

    await expect(repository.findByUserId(userId)).resolves.toBe(records);
    expect(userSkill.findMany).toHaveBeenCalledWith({
      where: { userId },
      orderBy: { skill: { name: 'asc' } },
      select,
    });
  });

  it('replaces the skills of the user in a single transaction keeping the ones that remain', async () => {
    const records = [{ skill: { id: skillId, name: 'Python', isCustom: false } }];
    userSkill.findMany.mockResolvedValue(records);

    await expect(repository.replaceForUser(userId, [skillId, otherSkillId])).resolves.toBe(records);
    expect(userSkill.deleteMany).toHaveBeenCalledWith({
      where: { userId, skillId: { notIn: [skillId, otherSkillId] } },
    });
    expect(userSkill.createMany).toHaveBeenCalledWith({
      data: [
        { userId, skillId },
        { userId, skillId: otherSkillId },
      ],
      skipDuplicates: true,
    });
    expect(transaction).toHaveBeenCalledWith(['delete-operation', 'create-operation']);
  });

  it('removes every skill when the new list is empty', async () => {
    userSkill.findMany.mockResolvedValue([]);

    await repository.replaceForUser(userId, []);

    expect(userSkill.deleteMany).toHaveBeenCalledWith({
      where: { userId, skillId: { notIn: [] } },
    });
  });
});
