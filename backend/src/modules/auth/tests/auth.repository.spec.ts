import type { PasswordHistoryRepository } from '../repositories/password-history.repository.js';
import { describe, expect, it, vi } from 'vitest';
import { AuthRepository } from '../repositories/auth.repository.js';

function build() {
  const user = { findUnique: vi.fn(), findFirst: vi.fn() };
  return { user, repository: new AuthRepository({ user } as any, {} as PasswordHistoryRepository) };
}

describe('AuthRepository (vinculación de Google)', () => {
  function buildPrisma() {
    const prisma = {
      user: { findUnique: vi.fn() },
      accessRequest: { findFirst: vi.fn() },
    };
    return { prisma, repository: new AuthRepository(prisma as never, {} as never) };
  }

  it('findUserByIdWithRoles selecciona correo, estado y roles activos', async () => {
    const { prisma, repository } = buildPrisma();
    prisma.user.findUnique.mockResolvedValue(null);

    await repository.findUserByIdWithRoles('u-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'u-1' },
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

  it.each([
    [{ id: 'r-1' }, true],
    [null, false],
  ])('hasUnapprovedAccessRequest busca solicitudes enviadas y no aprobadas (%o -> %s)', async (found, expected) => {
    const { prisma, repository } = buildPrisma();
    prisma.accessRequest.findFirst.mockResolvedValue(found);

    await expect(repository.hasUnapprovedAccessRequest('Ana@UMSS.edu.bo')).resolves.toBe(expected);

    expect(prisma.accessRequest.findFirst).toHaveBeenCalledWith({
      where: {
        email: { equals: 'Ana@UMSS.edu.bo', mode: 'insensitive' },
        submittedAt: { not: null },
        status: { title: { not: 'approved' } },
      },
      select: { id: true },
    });
  });
});

describe('AuthRepository', () => {
  it('findUserByEmailWithRoles busca por correo e selecciona solo campos de autenticación y roles activos', async () => {
    const { user, repository } = build();
    user.findUnique.mockResolvedValue(null);

    await repository.findUserByEmailWithRoles('ana@umss.edu.bo');

    const args = user.findUnique.mock.calls[0][0];
    expect(args.where).toEqual({ email: 'ana@umss.edu.bo' });
    expect(args.select).toEqual({
      id: true,
      password: true,
      isActive: true,
      roles: {
        where: { deletedAt: null, startAt: { lte: expect.any(Date) } },
        select: { role: { select: { name: true } } },
      },
    });
    expect(args.include).toBeUndefined();
  });

  it.each([
    [{ id: 'u-1' }, true],
    [null, false],
  ])(
    'existsByEmail busca sin distinguir mayúsculas (%o -> %s)',
    async (found, expected) => {
      const { user, repository } = build();
      user.findFirst.mockResolvedValue(found);

      await expect(repository.existsByEmail('Ana@umss.edu.bo')).resolves.toBe(
        expected,
      );

      const args = user.findFirst.mock.calls[0][0];
      expect(args.where).toEqual({
        email: { equals: 'Ana@umss.edu.bo', mode: 'insensitive' },
      });
      expect(args.select).toEqual({ id: true });
    },
  );
});
