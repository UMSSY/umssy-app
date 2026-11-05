import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarAccessRepository } from '../repositories/radar-access.repository.js';

const USER_ID = '11111111-1111-4111-8111-111111111111';

function setup() {
  const prisma = {
    userRole: { findFirst: vi.fn() },
    $executeRaw: vi.fn().mockResolvedValue(1),
  };
  const repository = new RadarAccessRepository(
    prisma as unknown as PrismaService,
  );
  return { prisma, repository };
}

describe('RadarAccessRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('indica si el usuario tiene un rol activo', async () => {
    const { prisma, repository } = setup();
    prisma.userRole.findFirst.mockResolvedValueOnce({ id: 'role-user' });
    prisma.userRole.findFirst.mockResolvedValueOnce(null);

    await expect(repository.hasRole(USER_ID, 'empresa')).resolves.toBe(true);
    await expect(repository.hasRole(USER_ID, 'mentor')).resolves.toBe(false);
    expect(prisma.userRole.findFirst).toHaveBeenNthCalledWith(1, {
      where: { userId: USER_ID, deletedAt: null, role: { name: 'empresa' } },
      select: { id: true },
    });
  });

  it('indica si el usuario tiene alguno de varios roles', async () => {
    const { prisma, repository } = setup();
    prisma.userRole.findFirst.mockResolvedValueOnce({ id: 'role-user' });
    prisma.userRole.findFirst.mockResolvedValueOnce(null);

    await expect(
      repository.hasAnyRole(USER_ID, ['titulado', 'estudiante']),
    ).resolves.toBe(true);
    await expect(repository.hasAnyRole(USER_ID, ['empresa'])).resolves.toBe(false);
    expect(prisma.userRole.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        userId: USER_ID,
        deletedAt: null,
        role: { name: { in: ['titulado', 'estudiante'] } },
      },
      select: { id: true },
    });
  });

  it('registra auditoría con y sin detalles explícitos', async () => {
    const { prisma, repository } = setup();

    await repository.recordAudit(USER_ID, USER_ID, 'radar.published', null);
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(1);

    await repository.recordAudit(
      USER_ID,
      null,
      'application.hired',
      '22222222-2222-4222-8222-222222222222',
      { applicationId: 'app-1' },
    );
    expect(prisma.$executeRaw).toHaveBeenCalledTimes(2);
  });
});
