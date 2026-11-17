import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { EventAffinitySignalsRepository } from '../repositories/event-affinity-signals.repository.js';

function buildPrisma(overrides: {
  user?: unknown;
  userSkills?: unknown[];
  educations?: unknown[];
  snapshot?: unknown;
}) {
  return {
    user: { findUnique: vi.fn().mockResolvedValue(overrides.user ?? null) },
    userSkill: {
      findMany: vi.fn().mockResolvedValue(overrides.userSkills ?? []),
    },
    education: {
      findMany: vi.fn().mockResolvedValue(overrides.educations ?? []),
    },
    radarScoreSnapshot: {
      findFirst: vi.fn().mockResolvedValue(overrides.snapshot ?? null),
    },
  };
}

describe('EventAffinitySignalsRepository', () => {
  it('reads the profile signals without the rejected skills', async () => {
    const prisma = buildPrisma({
      user: { headline: 'Frontend dev', aboutMe: '  ' },
      userSkills: [{ skill: { name: 'React' } }],
      educations: [{ degree: ' Ingeniería de Sistemas ' }, { degree: ' ' }],
      snapshot: { scores: { desarrollo: 6 } },
    });
    const repository = new EventAffinitySignalsRepository(
      prisma as unknown as PrismaService,
    );

    const signals = await repository.findByUserId('user-1');

    expect(signals).toEqual({
      skills: ['React'],
      radarScores: { desarrollo: 6 },
      careers: ['Ingeniería de Sistemas'],
      interests: 'Frontend dev',
    });
    expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        verificationStatus: { notIn: ['rejected', 'revoked'] },
      },
      select: { skill: { select: { name: true } } },
    });
    expect(prisma.radarScoreSnapshot.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { version: 'desc' },
      select: { scores: true },
    });
  });

  it('returns empty signals for a profile without data', async () => {
    const repository = new EventAffinitySignalsRepository(
      buildPrisma({}) as unknown as PrismaService,
    );

    await expect(repository.findByUserId('user-1')).resolves.toEqual({
      skills: [],
      radarScores: {},
      careers: [],
      interests: '',
    });
  });
});
