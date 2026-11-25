import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { PASSWORD_HISTORY_LIMIT } from '../constants/password-history.constants.js';
import { PasswordHistoryRepository } from '../repositories/password-history.repository.js';

function buildRepository() {
  const user = { findUnique: vi.fn() };
  const passwordHistory = {
    create: vi.fn().mockResolvedValue({ id: 'new-history' }),
    findMany: vi.fn().mockResolvedValue([]),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
  const transaction = { user, passwordHistory };
  const prisma = {
    $transaction: vi.fn(
      (operation: (client: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    ),
  };
  return {
    user,
    passwordHistory,
    prisma,
    transaction: transaction as unknown as Prisma.TransactionClient,
    repository: new PasswordHistoryRepository(
      prisma as unknown as PrismaService,
    ),
  };
}

describe('Repositorio del historial de contraseñas', () => {
  it('consulta el hash actual y los últimos N con una lectura consistente', async () => {
    const { repository, prisma, user } = buildRepository();
    const result = {
      password: 'current-hash',
      passwordHistories: [{ passwordHash: 'previous-hash' }],
    };
    user.findUnique.mockResolvedValueOnce(result);

    await expect(repository.findSnapshot('user-1')).resolves.toEqual(result);

    expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
      isolationLevel: 'RepeatableRead',
    });
    expect(user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      select: {
        password: true,
        passwordHistories: {
          take: PASSWORD_HISTORY_LIMIT,
          orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
          select: { passwordHash: true },
        },
      },
    });
  });

  it('devuelve null si el usuario ya no existe', async () => {
    const { repository, user } = buildRepository();
    user.findUnique.mockResolvedValueOnce(null);

    await expect(repository.findSnapshot('missing-user')).resolves.toBeNull();
  });

  it('registra el hash anterior en la transacción recibida y conserva los últimos N', async () => {
    const { repository, prisma, passwordHistory, transaction } =
      buildRepository();
    passwordHistory.findMany.mockResolvedValueOnce([
      { id: 'obsolete-1' },
      { id: 'obsolete-2' },
    ]);

    await repository.recordPreviousAndTrim(
      transaction,
      'user-1',
      'previous-hash',
    );

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(passwordHistory.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', passwordHash: 'previous-hash' },
    });
    expect(passwordHistory.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: PASSWORD_HISTORY_LIMIT,
      select: { id: true },
    });
    expect(passwordHistory.deleteMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-1',
        id: { in: ['obsolete-1', 'obsolete-2'] },
      },
    });
    expect(passwordHistory.create.mock.invocationCallOrder[0]).toBeLessThan(
      passwordHistory.findMany.mock.invocationCallOrder[0],
    );
    expect(passwordHistory.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      passwordHistory.deleteMany.mock.invocationCallOrder[0],
    );
  });

  it('no elimina registros cuando el historial todavía cabe en N', async () => {
    const { repository, passwordHistory, transaction } = buildRepository();

    await repository.recordPreviousAndTrim(
      transaction,
      'user-1',
      'previous-hash',
    );

    expect(passwordHistory.create).toHaveBeenCalledOnce();
    expect(passwordHistory.deleteMany).not.toHaveBeenCalled();
  });

  it('propaga un fallo de inserción sin intentar limpiar el historial', async () => {
    const { repository, passwordHistory, transaction } = buildRepository();
    const failure = new Error('simulated history insert failure');
    passwordHistory.create.mockRejectedValueOnce(failure);

    await expect(
      repository.recordPreviousAndTrim(
        transaction,
        'user-1',
        'previous-hash',
      ),
    ).rejects.toBe(failure);
    expect(passwordHistory.findMany).not.toHaveBeenCalled();
    expect(passwordHistory.deleteMany).not.toHaveBeenCalled();
  });

  it.each(['findMany', 'deleteMany'] as const)(
    'propaga un fallo de %s para que la transacción exterior pueda revertirse',
    async (operation) => {
      const { repository, passwordHistory, transaction } = buildRepository();
      const failure = new Error('simulated history cleanup failure');
      if (operation === 'deleteMany') {
        passwordHistory.findMany.mockResolvedValueOnce([{ id: 'obsolete-1' }]);
      }
      passwordHistory[operation].mockRejectedValueOnce(failure);

      await expect(
        repository.recordPreviousAndTrim(
          transaction,
          'user-1',
          'previous-hash',
        ),
      ).rejects.toBe(failure);
    },
  );
});

