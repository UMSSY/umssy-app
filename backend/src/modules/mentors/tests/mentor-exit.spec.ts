import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorExitController } from '../controllers/mentor-exit.controller.js';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';

vi.mock('../repositories/mentor-offers.queries.js', () => ({ reconcileMentorOffers: vi.fn() }));

describe('salida definitiva HU-7-5', () => {
  it('exige JWT y utiliza exclusivamente el usuario autenticado', async () => {
    const repository = { leave: vi.fn().mockResolvedValue({ status: 'ENDED' }) };
    const controller = new MentorExitController(repository as unknown as MentorExitRepository);
    expect(Reflect.getMetadata(GUARDS_METADATA, MentorExitController)).toContain(JwtAuthGuard);
    await controller.leave({ id: 'authenticated-user' } as AuthenticatedUser);
    expect(repository.leave).toHaveBeenCalledWith('authenticated-user');
  });

  it('propaga una falla de persistencia y no ejecuta la reasignación después del error', async () => {
    const failure = new Error('No se pudo actualizar la disponibilidad');
    const query = vi.fn(async (strings: TemplateStringsArray) =>
      strings.join(' ').includes('AS blocked') ? [{ blocked: false }] : [{ id: 'role' }]);
    const update = vi.fn().mockRejectedValue(failure);
    const tx = { $executeRaw: vi.fn(), $queryRaw: query, user: { update } };
    const transaction = vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx));
    const repository = new MentorExitRepository({ $transaction: transaction } as unknown as PrismaService);
    await expect(repository.leave('user')).rejects.toBe(failure);
    expect(query.mock.calls.some(([strings]) => strings.join(' ').includes('approvedGraduates'))).toBe(false);
    expect(transaction).toHaveBeenCalledWith(expect.any(Function), expect.objectContaining({ isolationLevel: 'ReadCommitted' }));
  });

  it('revoca el rol, termina la solicitud y conserva ambas preferencias', async () => {
    const query = vi.fn(async (strings: TemplateStringsArray) =>
      strings.join(' ').includes('AS blocked') ? [{ blocked: false }] : [{ id: 'role' }]);
    const execute = vi.fn().mockResolvedValue(1);
    const tx = { $queryRaw: query, $executeRaw: execute,
      user: { update: vi.fn().mockResolvedValue({ id: 'user' }) },
      mentorTechnicalArea: { deleteMany: vi.fn() },
      mentorOrientationType: { deleteMany: vi.fn() },
    };
    const prisma = { $transaction: vi.fn(async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx)) };
    const repository = new MentorExitRepository(prisma as unknown as PrismaService);

    expect(await repository.leave('user')).toEqual({ id: 'user', status: 'ENDED', alreadyEnded: false });
    expect(execute.mock.calls.some(([strings]) => strings.join(' ').includes('UPDATE user_roles'))).toBe(true);
    expect(execute.mock.calls.some(([strings]) => strings.join(' ').includes('status = \'ENDED\''))).toBe(true);
    expect(tx.user.update).toHaveBeenCalledWith({ where: { id: 'user' }, data: { isAvailableForMentoring: false } });
    expect(tx.mentorTechnicalArea.deleteMany).not.toHaveBeenCalled();
    expect(tx.mentorOrientationType.deleteMany).not.toHaveBeenCalled();
  });

  it('no altera el cupo ni las preferencias cuando ya salió', async () => {
    const tx = { $queryRaw: vi.fn().mockResolvedValue([]), $executeRaw: vi.fn(), user: { update: vi.fn() } };
    const repository = new MentorExitRepository({
      $transaction: async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx),
    } as unknown as PrismaService);
    expect(await repository.leave('user')).toEqual({ id: 'user', status: 'ENDED', alreadyEnded: true });
    expect(tx.user.update).not.toHaveBeenCalled();
  });

  it('mantiene el rol y el cupo si existen citas futuras', async () => {
    const tx = {
      $queryRaw: vi.fn(async (strings: TemplateStringsArray) =>
        strings.join(' ').includes('AS blocked') ? [{ blocked: true }] : [{ id: 'role' }]),
      $executeRaw: vi.fn(), user: { update: vi.fn() },
    };
    const repository = new MentorExitRepository({
      $transaction: async (operation: (value: typeof tx) => Promise<unknown>) => operation(tx),
    } as unknown as PrismaService);
    await expect(repository.leave('user')).rejects.toMatchObject({ statusCode: 409 });
    expect(tx.$executeRaw.mock.calls.some(([strings]) => strings.join(' ').includes('UPDATE user_roles'))).toBe(false);
    expect(tx.user.update).not.toHaveBeenCalled();
  });
});
