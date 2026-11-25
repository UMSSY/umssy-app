import type { PasswordHistoryService } from '../services/password-history.service.js';
import { describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import type { JwtService } from '@nestjs/jwt';
import type { MailService } from '../../mail/services/mail.service.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import { AuthService } from '../services/auth.service.js';
import type { RefreshTokenService } from '../services/refresh-token.service.js';

async function buildService() {
  const repository = {
    findUserByEmail: vi.fn().mockResolvedValue({ id: 'user-1' }),
    findLatestValidOtp: vi.fn().mockResolvedValue({
      id: 'otp-1',
      codeHash: await bcrypt.hash('123456', 4),
      attempts: 0,
      expiresAt: new Date(Date.now() + 300_000),
    }),
    updateUserPasswordAndInvalidateOtp: vi.fn(),
  };
  const refreshTokens = { revokeAllForUser: vi.fn() };
  const history = {
    validateNewPassword: vi.fn().mockResolvedValue('observed-hash'),
  };
  return {
    repository,
    refreshTokens,
    history,
    service: new AuthService(
      repository as unknown as AuthRepository,
      {} as JwtService,
      {} as MailService,
      refreshTokens as unknown as RefreshTokenService,
      history as unknown as PasswordHistoryService,
    ),
  };
}

describe('Confirmación de recuperación y sesiones', () => {
  it('verificar el código no lo consume ni revoca las sesiones', async () => {
    const { repository, refreshTokens, history, service } = await buildService();
    await expect(
      service.verifyPasswordReset({ email: 'user@example.test', code: '123456' }),
    ).resolves.toMatchObject({ ok: true });
    expect(repository.updateUserPasswordAndInvalidateOtp).not.toHaveBeenCalled();
    expect(history.validateNewPassword).not.toHaveBeenCalled();
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('guarda un hash de la nueva contraseña y después revoca las sesiones', async () => {
    const { repository, refreshTokens, service } = await buildService();
    await expect(
      service.resetPassword({
        email: 'user@example.test',
        code: '123456',
        password: 'NuevaContrasena1',
      }),
    ).resolves.toMatchObject({ ok: true });
    const [userId, hash, otpId] =
      repository.updateUserPasswordAndInvalidateOtp.mock.calls[0] as [
        string,
        string,
        string,
      ];
    expect([userId, otpId]).toEqual(['user-1', 'otp-1']);
    expect(await bcrypt.compare('NuevaContrasena1', hash)).toBe(true);
    expect(refreshTokens.revokeAllForUser).toHaveBeenCalledWith('user-1');
    expect(
      repository.updateUserPasswordAndInvalidateOtp.mock.invocationCallOrder[0],
    ).toBeLessThan(refreshTokens.revokeAllForUser.mock.invocationCallOrder[0]);
  });

  it('un envío que pierde el consumo no devuelve éxito ni revoca sesiones', async () => {
    const { repository, refreshTokens, service } = await buildService();
    repository.updateUserPasswordAndInvalidateOtp.mockRejectedValue(
      new InvalidResetCodeException(),
    );
    await expect(
      service.resetPassword({
        email: 'user@example.test',
        code: '123456',
        password: 'NuevaContrasena1',
      }),
    ).rejects.toBeInstanceOf(InvalidResetCodeException);
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('un fallo al guardar no revoca las sesiones', async () => {
    const { repository, refreshTokens, service } = await buildService();
    const failure = new Error('simulated password persistence failure');
    repository.updateUserPasswordAndInvalidateOtp.mockRejectedValue(failure);
    await expect(
      service.resetPassword({
        email: 'user@example.test',
        code: '123456',
        password: 'NuevaContrasena1',
      }),
    ).rejects.toBe(failure);
    expect(refreshTokens.revokeAllForUser).not.toHaveBeenCalled();
  });
});
