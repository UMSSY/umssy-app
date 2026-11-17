import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MAX_OTP_ATTEMPTS } from '../constants/password-reset.constants.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { AuthRepository } from '../repositories/auth.repository.js';

function buildRepository() {
  const user = { update: vi.fn() };
  const passwordResetOtp = { updateMany: vi.fn() };
  const transaction = { user, passwordResetOtp };
  const prisma = {
    $transaction: vi.fn(
      (operation: (client: typeof transaction) => Promise<unknown>) =>
        operation(transaction),
    ),
  };
  return {
    user,
    passwordResetOtp,
    repository: new AuthRepository(prisma as unknown as PrismaService),
  };
}

describe('Consumo del código de recuperación', () => {
  afterEach(() => vi.useRealTimers());

  it('solo actualiza la contraseña después de consumir el código disponible del mismo usuario', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-11-16T12:00:00.000Z');
    vi.setSystemTime(now);
    const { user, passwordResetOtp, repository } = buildRepository();
    passwordResetOtp.updateMany.mockResolvedValue({ count: 1 });
    user.update.mockResolvedValue({ id: 'user-1', password: 'new-hash' });

    await expect(
      repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1'),
    ).resolves.toEqual({ id: 'user-1', password: 'new-hash' });

    expect(passwordResetOtp.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'otp-1',
        userId: 'user-1',
        usedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: MAX_OTP_ATTEMPTS },
      },
      data: { usedAt: now },
    });
    expect(user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { password: 'new-hash' },
    });
    expect(passwordResetOtp.updateMany.mock.invocationCallOrder[0]).toBeLessThan(
      user.update.mock.invocationCallOrder[0],
    );
  });

  it('rechaza un código que dejó de estar disponible sin actualizar la contraseña', async () => {
    const { user, passwordResetOtp, repository } = buildRepository();
    passwordResetOtp.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1'),
    ).rejects.toBeInstanceOf(InvalidResetCodeException);
    expect(user.update).not.toHaveBeenCalled();
  });

  it('propaga el fallo de persistencia del código sin intentar guardar la contraseña', async () => {
    const { user, passwordResetOtp, repository } = buildRepository();
    const failure = new Error('simulated persistence failure');
    passwordResetOtp.updateMany.mockRejectedValue(failure);

    await expect(
      repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1'),
    ).rejects.toBe(failure);
    expect(user.update).not.toHaveBeenCalled();
  });

  it('propaga el fallo de guardado para que la transacción pueda revertirse', async () => {
    const { user, passwordResetOtp, repository } = buildRepository();
    const failure = new Error('simulated password failure');
    passwordResetOtp.updateMany.mockResolvedValue({ count: 1 });
    user.update.mockRejectedValue(failure);

    await expect(
      repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1'),
    ).rejects.toBe(failure);
  });
});
