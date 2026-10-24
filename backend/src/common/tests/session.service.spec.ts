import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../prisma/prisma.service.js';
import { SessionService } from '../services/session.service.js';

function createService() {
  const findFirst = vi.fn();
  const repository = { user: { findFirst } } as unknown as PrismaService;
  return { service: new SessionService(repository), findFirst };
}

describe('SessionService', () => {
  it('returns the current database identity and deduplicates assigned roles', async () => {
    const { service, findFirst } = createService();
    findFirst.mockResolvedValue({
      id: 'user-1', email: 'user@test.com',
      roles: ['titulado', 'mentor', 'mentor'].map((name) => ({ role: { name } })),
    });
    await expect(service.getAuthenticatedUser('user-1')).resolves.toEqual({
      id: 'user-1', email: 'user@test.com', roles: ['titulado', 'mentor'],
    });
    expect(findFirst).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ where: { id: 'user-1' } }));
  });

  it('rejects users that do not exist', async () => {
    const { service, findFirst } = createService();
    findFirst.mockResolvedValue(null);
    await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
      statusCode: 401, message: 'Se requiere una sesión válida.',
    });
  });

  it('rejects users without current roles', async () => {
    const { service, findFirst } = createService();
    findFirst.mockResolvedValue({ id: 'user-1', email: 'user@test.com', roles: [] });
    await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
      statusCode: 401, message: 'Se requiere una sesión válida.',
    });
  });

  it('propagates infrastructure errors without misreporting invalid credentials', async () => {
    const { service, findFirst } = createService();
    const error = new Error('Database unavailable');
    findFirst.mockRejectedValue(error);
    await expect(service.getAuthenticatedUser('user-1')).rejects.toBe(error);
  });
});

it('rejects an inactive account with 403 instead of 401', async () => {
  const { service, findFirst } = createService();
  findFirst.mockResolvedValue({ id: 'user-1', isActive: false, roles: [] });
  await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
    statusCode: 403, code: 'USER_INACTIVE',
  });
});
