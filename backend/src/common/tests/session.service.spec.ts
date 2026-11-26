import { describe, expect, it, vi } from 'vitest';
import { SessionRepository } from '../repositories/session.repository.js';
import { SessionService } from '../services/session.service.js';

function createService() {
  const findUserById = vi.fn();
  const repository = { findUserById } as unknown as SessionRepository;
  return { service: new SessionService(repository), findUserById };
}

describe('SessionService', () => {
  it('returns the current database identity and deduplicates assigned roles', async () => {
    const { service, findUserById } = createService();
    findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      isActive: true,
      roles: ['titulado', 'mentor', 'mentor'].map((name) => ({
        role: { name },
      })),
    });
    await expect(service.getAuthenticatedUser('user-1')).resolves.toEqual({
      id: 'user-1',
      email: 'user@test.com',
      roles: ['titulado', 'mentor'],
      company: null,
    });
    expect(findUserById).toHaveBeenCalledExactlyOnceWith('user-1');
  });

  it('loads the company relationship from the current database record', async () => {
    const { service, findUserById } = createService();
    findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'company@test.com',
      isActive: true,
      company: { id: 'real-company', title: 'Empresa real' },
      roles: [{ role: { name: 'empresa' } }],
    });
    expect((await service.getAuthenticatedUser('user-1')).company).toEqual({
      id: 'real-company',
      name: 'Empresa real',
    });
    findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'company@test.com',
      isActive: true,
      company: null,
      roles: [{ role: { name: 'empresa' } }],
    });
    expect((await service.getAuthenticatedUser('user-1')).company).toBeNull();
  });

  it('rejects nonexistent users with unauthorized session', async () => {
    const { service, findUserById } = createService();
    findUserById.mockResolvedValue(null);
    await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects inactive users with user inactive exception', async () => {
    const { service, findUserById } = createService();
    findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      isActive: false,
      roles: [{ role: { name: 'titulado' } }],
    });
    await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'USER_INACTIVE',
    });
  });

  it('rejects users without current roles', async () => {
    const { service, findUserById } = createService();
    findUserById.mockResolvedValue({
      id: 'user-1',
      email: 'user@test.com',
      isActive: true,
      roles: [],
    });
    await expect(service.getAuthenticatedUser('user-1')).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('propagates infrastructure errors without misreporting invalid credentials', async () => {
    const { service, findUserById } = createService();
    const error = new Error('Database unavailable');
    findUserById.mockRejectedValue(error);
    await expect(service.getAuthenticatedUser('user-1')).rejects.toBe(error);
  });
});
