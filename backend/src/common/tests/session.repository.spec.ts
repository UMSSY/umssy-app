import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SessionRepository } from '../repositories/session.repository.js';

describe('SessionRepository', () => {
  it('selects only session fields and filters inactive users and role assignments', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new SessionRepository({ user: { findFirst } } as unknown as PrismaService);

    await expect(repository.findActiveUserById('user-1')).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'user-1', isActive: true },
      select: {
        id: true,
        email: true,
        roles: {
          where: { deletedAt: null, startAt: { lte: expect.any(Date) } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  });

  it('selects user session data with active flag for authentication', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new SessionRepository({ user: { findFirst } } as unknown as PrismaService);

    await expect(repository.findUserById('user-1')).resolves.toBeNull();
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { id: 'user-1' },
      select: {
        id: true,
        email: true,
        isActive: true,
        roles: {
          where: { deletedAt: null, startAt: { lte: expect.any(Date) } },
          select: { role: { select: { name: true } } },
        },
      },
    });
  });
});
