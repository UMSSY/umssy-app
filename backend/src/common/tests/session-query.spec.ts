import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SessionService } from '../services/session.service.js';

describe('SessionService', () => {
  it('selects only session fields and loads activity and filters role assignments', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new SessionService({ user: { findFirst } } as unknown as PrismaService);

    await expect(repository.getAuthenticatedUser('user-1')).rejects.toMatchObject({ code: 'UNAUTHENTICATED' });
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
