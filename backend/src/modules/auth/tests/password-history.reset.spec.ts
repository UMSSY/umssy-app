import { describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import type { JwtService } from '@nestjs/jwt';
import type { MailService } from '../../mail/services/mail.service.js';
import type { AuthRepository } from '../repositories/auth.repository.js';
import type { PasswordHistoryRepository } from '../repositories/password-history.repository.js';
import { AuthService } from '../services/auth.service.js';
import { PasswordHistoryService } from '../services/password-history.service.js';
import type { RefreshTokenService } from '../services/refresh-token.service.js';
import { PasswordReusedException } from '../exceptions/password-reused.exception.js';
import { PasswordResetConflictException } from '../exceptions/password-reset-conflict.exception.js';

async function buildService() {
  const observed = await bcrypt.hash('ActualPassword1', 4);
  const history = {
    findSnapshot: vi.fn().mockResolvedValue({
      password: observed,
      passwordHistories: [{ passwordHash: await bcrypt.hash('AnteriorPassword1', 4) }],
    }),
  };
  const repository = {
    findUserByEmail: vi.fn().mockResolvedValue({ id: 'user-1' }),
    findLatestValidOtp: vi.fn().mockResolvedValue({
      id: 'otp-1', codeHash: await bcrypt.hash('123456', 4), attempts: 0,
      expiresAt: new Date(Date.now() + 300_000),
    }),
    updateUserPasswordAndInvalidateOtp: vi.fn().mockResolvedValue({ id: 'user-1' }),
  };
  const refresh = { revokeAllForUser: vi.fn().mockResolvedValue(undefined) };
  const service = new AuthService(
    repository as unknown as AuthRepository,
    {} as JwtService,
    {} as MailService,
    refresh as unknown as RefreshTokenService,
    new PasswordHistoryService(history as unknown as PasswordHistoryRepository),
  );
  return { service, repository, history, refresh, observed };
}

describe('Integración del historial con la recuperación', () => {
  it.each(['ActualPassword1', 'AnteriorPassword1'])(
    'rechaza %s antes de escribir o revocar las sesiones',
    async (password) => {
      const { service, repository, history, refresh } = await buildService();
      await expect(service.resetPassword({ email: 'user@example.test', code: '123456', password }))
        .rejects.toBeInstanceOf(PasswordReusedException);
      expect(history.findSnapshot).toHaveBeenCalledWith('user-1');
      expect(repository.updateUserPasswordAndInvalidateOtp).not.toHaveBeenCalled();
      expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
    },
  );

  it('entrega el hash observado al cambio atómico y revoca sesiones solo después de guardar', async () => {
    const { service, repository, refresh, observed } = await buildService();
    await expect(service.resetPassword({ email: 'user@example.test', code: '123456', password: 'NuevaPassword1' }))
      .resolves.toMatchObject({ ok: true });
    expect(repository.updateUserPasswordAndInvalidateOtp).toHaveBeenCalledWith('user-1', expect.any(String), 'otp-1', observed);
    const [, storedHash] = repository.updateUserPasswordAndInvalidateOtp.mock.calls[0] as [string, string, string, string];
    expect(storedHash).not.toBe('NuevaPassword1');
    expect(await bcrypt.compare('NuevaPassword1', storedHash)).toBe(true);
    expect(refresh.revokeAllForUser).toHaveBeenCalledWith('user-1');
    expect(refresh.revokeAllForUser).toHaveBeenCalledTimes(1);
    expect(repository.updateUserPasswordAndInvalidateOtp.mock.invocationCallOrder[0]).toBeLessThan(refresh.revokeAllForUser.mock.invocationCallOrder[0]);
  });

  it('no consulta el historial ni consume el código al verificarlo', async () => {
    const { service, repository, history, refresh } = await buildService();
    await expect(service.verifyPasswordReset({ email: 'user@example.test', code: '123456' })).resolves.toMatchObject({ ok: true });
    expect(history.findSnapshot).not.toHaveBeenCalled();
    expect(repository.updateUserPasswordAndInvalidateOtp).not.toHaveBeenCalled();
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
  });

  it('no devuelve éxito ni revoca sesiones si otro cambio invalidó la comprobación', async () => {
    const { service, repository, refresh } = await buildService();
    repository.updateUserPasswordAndInvalidateOtp.mockRejectedValueOnce(new PasswordResetConflictException());
    await expect(service.resetPassword({ email: 'user@example.test', code: '123456', password: 'NuevaPassword1' }))
      .rejects.toBeInstanceOf(PasswordResetConflictException);
    expect(refresh.revokeAllForUser).not.toHaveBeenCalled();
  });
});
