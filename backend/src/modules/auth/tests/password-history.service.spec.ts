import { describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { PASSWORD_HISTORY_LIMIT } from '../constants/password-history.constants.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { PasswordReusedException } from '../exceptions/password-reused.exception.js';
import type { PasswordHistoryRepository } from '../repositories/password-history.repository.js';
import { PasswordHistoryService } from '../services/password-history.service.js';
import type { PasswordHistorySnapshot } from '../types/password-history.types.js';

async function snapshot(
  current: string | null,
  previous: string[] = [],
): Promise<PasswordHistorySnapshot> {
  return {
    password: current === null ? null : await bcrypt.hash(current, 4),
    passwordHistories: await Promise.all(
      previous.map(async (password) => ({
        passwordHash: await bcrypt.hash(password, 4),
      })),
    ),
  };
}

function buildService(value: PasswordHistorySnapshot | null) {
  const repository = { findSnapshot: vi.fn().mockResolvedValue(value) };
  const service = new PasswordHistoryService(
    repository as unknown as PasswordHistoryRepository,
  );
  return { repository, service };
}

describe('Validación del historial de contraseñas', () => {
  it('rechaza la contraseña actual con el contrato de error correspondiente', async () => {
    const { service } = buildService(await snapshot('ActualPassword1'));
    const failure: unknown = await service
      .validateNewPassword('user-1', 'ActualPassword1')
      .catch((cause: unknown) => cause);

    expect(failure).toBeInstanceOf(PasswordReusedException);
    expect(failure).toMatchObject({
      code: 'PASSWORD_REUSED',
      message: 'Elige una contraseña que no hayas usado antes.',
    });
    expect((failure as PasswordReusedException).statusCode).toBe(400);
  });

  it.each(Array.from({ length: PASSWORD_HISTORY_LIMIT }, (_, index) => index))(
    'rechaza una contraseña ubicada en la posición %i del historial',
    async (index) => {
      const previous = Array.from(
        { length: PASSWORD_HISTORY_LIMIT },
        (_, position) => `AnteriorPassword${position}`,
      );
      const { service } = buildService(
        await snapshot('ActualPassword1', previous),
      );

      await expect(
        service.validateNewPassword('user-1', previous[index]),
      ).rejects.toBeInstanceOf(PasswordReusedException);
    },
  );

  it('acepta una contraseña nueva y devuelve el hash actual observado', async () => {
    const value = await snapshot('ActualPassword1', ['AnteriorPassword1']);
    const { repository, service } = buildService(value);

    await expect(
      service.validateNewPassword('user-1', 'NuevaPassword1'),
    ).resolves.toBe(value.password);
    expect(repository.findSnapshot).toHaveBeenCalledWith('user-1');
    expect(value.password).not.toBe('ActualPassword1');
  });

  it('compara con bcrypt aunque la misma contraseña tenga hashes distintos', async () => {
    const value = await snapshot('ActualPassword1', ['AnteriorPassword1']);
    const secondHash = await bcrypt.hash('AnteriorPassword1', 4);
    expect(secondHash).not.toBe(value.passwordHistories[0].passwordHash);
    const { service } = buildService(value);

    await expect(
      service.validateNewPassword('user-1', 'AnteriorPassword1'),
    ).rejects.toBeInstanceOf(PasswordReusedException);
  });

  it('permite establecer una contraseña cuando no hay hash actual ni historial', async () => {
    const { service } = buildService(await snapshot(null));

    await expect(
      service.validateNewPassword('user-1', 'NuevaPassword1'),
    ).resolves.toBeNull();
  });

  it('comprueba el historial aunque el usuario no tenga una contraseña actual', async () => {
    const { service } = buildService(
      await snapshot(null, ['AnteriorPassword1']),
    );

    await expect(
      service.validateNewPassword('user-1', 'AnteriorPassword1'),
    ).rejects.toBeInstanceOf(PasswordReusedException);
  });

  it('rechaza un usuario que ya no está disponible', async () => {
    const { service } = buildService(null);

    await expect(
      service.validateNewPassword('missing-user', 'NuevaPassword1'),
    ).rejects.toBeInstanceOf(InvalidResetCodeException);
  });

  it('propaga los fallos de consulta sin aceptar la contraseña', async () => {
    const { repository, service } = buildService(null);
    const failure = new Error('simulated history read failure');
    repository.findSnapshot.mockRejectedValueOnce(failure);

    await expect(
      service.validateNewPassword('user-1', 'NuevaPassword1'),
    ).rejects.toBe(failure);
  });
});

