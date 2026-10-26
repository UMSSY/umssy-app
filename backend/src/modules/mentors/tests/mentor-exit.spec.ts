import 'reflect-metadata';
import { describe, expect, it, vi } from 'vitest';
import { GUARDS_METADATA } from '@nestjs/common/constants.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorExitController } from '../controllers/mentor-exit.controller.js';
import { MentorExitRepository } from '../repositories/mentor-exit.repository.js';

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
});
