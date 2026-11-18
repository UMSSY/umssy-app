import { afterEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MAX_OTP_ATTEMPTS } from '../constants/password-reset.constants.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { PasswordResetConflictException } from '../exceptions/password-reset-conflict.exception.js';
import { AuthRepository } from '../repositories/auth.repository.js';
import type { PasswordHistoryRepository } from '../repositories/password-history.repository.js';

function buildRepository() {
  const user = {
    updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    findUniqueOrThrow: vi.fn().mockResolvedValue({ id: 'user-1', password: 'new-hash' }),
  };
  const passwordResetOtp = { updateMany: vi.fn().mockResolvedValue({ count: 1 }) };
  const transaction = { user, passwordResetOtp };
  const history = { recordPreviousAndTrim: vi.fn().mockResolvedValue(undefined) };
  const prisma = {
    $transaction: vi.fn(
      (operation: (client: typeof transaction) => Promise<unknown>) => operation(transaction),
    ),
  };
  return {
    user, passwordResetOtp, transaction, history,
    repository: new AuthRepository(
      prisma as unknown as PrismaService,
      history as unknown as PasswordHistoryRepository,
    ),
  };
}

describe('Cambio de contraseña, consumo del código e historial', () => {
  afterEach(() => vi.useRealTimers());

  it('condiciona el código y la versión de contraseña antes de registrar el historial en la misma transacción', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-11-17T12:00:00.000Z');
    vi.setSystemTime(now);
    const { user, passwordResetOtp, repository, history, transaction } = buildRepository();

    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash'))
      .resolves.toEqual({ id: 'user-1', password: 'new-hash' });

    expect(passwordResetOtp.updateMany).toHaveBeenCalledWith({
      where: { id: 'otp-1', userId: 'user-1', usedAt: null, expiresAt: { gt: now }, attempts: { lt: MAX_OTP_ATTEMPTS } },
      data: { usedAt: now },
    });
    expect(user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', password: 'old-hash' },
      data: { password: 'new-hash' },
    });
    expect(history.recordPreviousAndTrim).toHaveBeenCalledWith(transaction, 'user-1', 'old-hash');
    expect(user.findUniqueOrThrow).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(passwordResetOtp.updateMany.mock.invocationCallOrder[0]).toBeLessThan(user.updateMany.mock.invocationCallOrder[0]);
    expect(user.updateMany.mock.invocationCallOrder[0]).toBeLessThan(history.recordPreviousAndTrim.mock.invocationCallOrder[0]);
    expect(history.recordPreviousAndTrim.mock.invocationCallOrder[0]).toBeLessThan(user.findUniqueOrThrow.mock.invocationCallOrder[0]);
  });

  it('rechaza un código que dejó de estar disponible sin actualizar contraseña ni historial', async () => {
    const { user, passwordResetOtp, repository, history } = buildRepository();
    passwordResetOtp.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash'))
      .rejects.toBeInstanceOf(InvalidResetCodeException);
    expect(user.updateMany).not.toHaveBeenCalled();
    expect(history.recordPreviousAndTrim).not.toHaveBeenCalled();
  });

  it('propaga un fallo al consumir el código sin intentar cambiar la contraseña', async () => {
    const { user, passwordResetOtp, repository, history } = buildRepository();
    const failure = new Error('simulated code persistence failure');
    passwordResetOtp.updateMany.mockRejectedValueOnce(failure);
    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash')).rejects.toBe(failure);
    expect(user.updateMany).not.toHaveBeenCalled();
    expect(history.recordPreviousAndTrim).not.toHaveBeenCalled();
  });

  it('propaga un fallo al guardar para que la transacción exterior se revierta', async () => {
    const { user, repository, history } = buildRepository();
    const failure = new Error('simulated password persistence failure');
    user.updateMany.mockRejectedValueOnce(failure);
    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash')).rejects.toBe(failure);
    expect(history.recordPreviousAndTrim).not.toHaveBeenCalled();
  });

  it('rechaza una validación que quedó desactualizada por otro cambio', async () => {
    const { user, repository, history } = buildRepository();
    user.updateMany.mockResolvedValueOnce({ count: 0 });
    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash'))
      .rejects.toMatchObject({ code: 'PASSWORD_RESET_CONFLICT', statusCode: 409 });
    expect(history.recordPreviousAndTrim).not.toHaveBeenCalled();
    expect(user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(new PasswordResetConflictException().message).toBe('La contraseña cambió durante esta solicitud. Vuelve a intentarlo.');
  });

  it('propaga un fallo del historial para revertir también el cambio y el consumo', async () => {
    const { user, repository, history } = buildRepository();
    const failure = new Error('simulated history persistence failure');
    history.recordPreviousAndTrim.mockRejectedValueOnce(failure);
    await expect(repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', 'old-hash')).rejects.toBe(failure);
    expect(user.findUniqueOrThrow).not.toHaveBeenCalled();
  });

  it('permite establecer la primera contraseña sin registrar un hash inexistente', async () => {
    const { user, repository, history } = buildRepository();
    await repository.updateUserPasswordAndInvalidateOtp('user-1', 'new-hash', 'otp-1', null);
    expect(user.updateMany).toHaveBeenCalledWith({ where: { id: 'user-1', password: null }, data: { password: 'new-hash' } });
    expect(history.recordPreviousAndTrim).not.toHaveBeenCalled();
  });
});
