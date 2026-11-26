import { ThrottlerStorageService } from '@nestjs/throttler';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CredentialLimitException } from '../exceptions/credential-limit.exception.js';
import { InvalidCredentialsException } from '../exceptions/invalid-credentials.exception.js';
import { InvalidResetCodeException } from '../exceptions/invalid-reset-code.exception.js';
import { CredentialLimitsService } from '../services/credential-limits.service.js';
import { CredentialSerialService } from '../services/credential-serial.service.js';
import { credentialKey } from '../utils/credential-key.js';

describe('Límites de credenciales con almacenamiento real de Throttler', () => {
  let storage: ThrottlerStorageService;
  let limits: CredentialLimitsService;
  const email = 'user@example.test';
  const succeed = async () => ({ ok: true });
  const badLogin = async () => {
    throw new InvalidCredentialsException();
  };
  const badCode = async () => {
    throw new InvalidResetCodeException();
  };

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-01-01T00:00:00Z'));
    storage = new ThrottlerStorageService();
    limits = new CredentialLimitsService(
      storage,
      new CredentialSerialService(),
    );
  });

  afterEach(() => {
    storage?.onApplicationShutdown();
    vi.useRealTimers();
  });

  it('restringe desde el quinto fallo de login y permite reintentar después de 15 minutos', async () => {
    for (let index = 0; index < 4; index++) {
      await expect(limits.run('login', email, badLogin)).rejects.toBeInstanceOf(
        InvalidCredentialsException,
      );
    }
    await expect(limits.run('login', email, badLogin)).rejects.toMatchObject({
      code: 'LOGIN_ATTEMPTS_LIMIT',
      retryAfterSeconds: 900,
    });
    const login = vi.fn(succeed);
    await expect(limits.run('login', email, login)).rejects.toBeInstanceOf(
      CredentialLimitException,
    );
    expect(login).not.toHaveBeenCalled();
    vi.setSystemTime(Date.now() + 900_000);
    await expect(limits.run('login', email, login)).resolves.toEqual({
      ok: true,
    });
    await expect(limits.run('login', email, badLogin)).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('los logins correctos no consumen intentos fallidos', async () => {
    for (let index = 0; index < 8; index++)
      await limits.run('login', email, succeed);
    await expect(limits.run('login', email, badLogin)).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('descarta los fallos que quedan fuera de la ventana móvil', async () => {
    for (let index = 0; index < 4; index++) {
      await expect(limits.run('login', email, badLogin)).rejects.toThrow();
    }
    vi.setSystemTime(Date.now() + 900_000);
    await expect(limits.run('login', email, badLogin)).rejects.toBeInstanceOf(
      InvalidCredentialsException,
    );
  });

  it('normaliza la identidad y mantiene independientes otras cuentas y la recuperación', async () => {
    for (let index = 0; index < 5; index++) {
      await expect(
        limits.run('login', ' USER@EXAMPLE.TEST ', badLogin),
      ).rejects.toThrow();
    }
    await expect(limits.run('login', email, succeed)).rejects.toBeInstanceOf(
      CredentialLimitException,
    );
    await expect(
      limits.run('login', 'other@example.test', succeed),
    ).resolves.toEqual({ ok: true });
    await expect(limits.run('request', email, succeed)).resolves.toEqual({
      ok: true,
    });
    expect(credentialKey(' USER@EXAMPLE.TEST ')).toBe(credentialKey(email));
    expect(credentialKey(email)).not.toContain(email);
  });

  it('mantiene dos minutos de espera sin ejecutar un segundo envío', async () => {
    const send = vi.fn(succeed);
    await limits.run('request', email, send);
    await expect(limits.run('request', email, send)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_COOLDOWN',
      retryAfterSeconds: 120,
    });
    expect(send).toHaveBeenCalledTimes(1);
    vi.setSystemTime(Date.now() + 120_000);
    await limits.run('request', email, send);
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('permite tres envíos y los reintentos rechazados no prolongan la ventana', async () => {
    const send = vi.fn(succeed);
    const started = Date.now();
    for (let index = 0; index < 3; index++) {
      vi.setSystemTime(started + index * 120_000);
      await limits.run('request', email, send);
    }
    vi.setSystemTime(started + 360_000);
    await expect(limits.run('request', email, send)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_REQUEST_LIMIT',
      retryAfterSeconds: 540,
    });
    vi.setSystemTime(started + 370_000);
    await expect(limits.run('request', email, send)).rejects.toMatchObject({
      retryAfterSeconds: 530,
    });
    expect(send).toHaveBeenCalledTimes(3);
    vi.setSystemTime(started + 900_000);
    await limits.run('request', email, send);
    expect(send).toHaveBeenCalledTimes(4);
  });

  it('aplica la cuota antes de consultar si la cuenta existe', async () => {
    const generic = vi.fn(succeed);
    await limits.run('request', 'missing@example.test', generic);
    await expect(
      limits.run('request', 'missing@example.test', generic),
    ).rejects.toMatchObject({
      code: 'PASSWORD_RESET_COOLDOWN',
    });
    expect(generic).toHaveBeenCalledTimes(1);
  });

  it('reenviar no elimina el bloqueo de verificación ni permite confirmar', async () => {
    for (let index = 0; index < 5; index++) {
      await expect(limits.run('verify', email, badCode)).rejects.toThrow();
    }
    await limits.run('request', email, succeed);
    const action = vi.fn(succeed);
    await expect(limits.run('verify', email, action)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_VERIFICATION_LIMIT',
    });
    await expect(limits.run('reset', email, action)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_VERIFICATION_LIMIT',
    });
    expect(action).not.toHaveBeenCalled();
    vi.setSystemTime(Date.now() + 900_000);
    await expect(limits.run('verify', email, action)).resolves.toEqual({
      ok: true,
    });
  });

  it('los códigos incorrectos al confirmar comparten el límite de verificación', async () => {
    for (let index = 0; index < 4; index++) {
      await expect(limits.run('verify', email, badCode)).rejects.toBeInstanceOf(
        InvalidResetCodeException,
      );
    }
    await expect(limits.run('reset', email, badCode)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_VERIFICATION_LIMIT',
      retryAfterSeconds: 900,
    });
  });

  it('limita a cinco confirmaciones y libera la cuota al vencer la ventana', async () => {
    const save = vi.fn(succeed);
    for (let index = 0; index < 5; index++)
      await limits.run('reset', email, save);
    await expect(limits.run('reset', email, save)).rejects.toMatchObject({
      code: 'PASSWORD_RESET_CONFIRMATION_LIMIT',
      retryAfterSeconds: 900,
    });
    expect(save).toHaveBeenCalledTimes(5);
    vi.setSystemTime(Date.now() + 900_000);
    await limits.run('reset', email, save);
    expect(save).toHaveBeenCalledTimes(6);
  });

  it.each(['login', 'verify'] as const)(
    'las solicitudes simultáneas no prueban más de cinco credenciales incorrectas: %s',
    async (operation) => {
      const attempt = vi.fn(operation === 'login' ? badLogin : badCode);
      const outcomes = await Promise.allSettled(
        Array.from({ length: 20 }, () => limits.run(operation, email, attempt)),
      );
      expect(attempt).toHaveBeenCalledTimes(5);
      expect(outcomes.every((outcome) => outcome.status === 'rejected')).toBe(
        true,
      );
    },
  );

  it.each(['request', 'reset'] as const)(
    'las solicitudes simultáneas respetan la cuota: %s',
    async (operation) => {
      const action = vi.fn(succeed);
      const outcomes = await Promise.allSettled(
        Array.from({ length: 20 }, () => limits.run(operation, email, action)),
      );
      const accepted = operation === 'request' ? 1 : 5;
      expect(action).toHaveBeenCalledTimes(accepted);
      expect(
        outcomes.filter((outcome) => outcome.status === 'fulfilled'),
      ).toHaveLength(accepted);
    },
  );

  it('un fallo interno libera la cola y no cuenta como credencial incorrecta', async () => {
    const error = new Error('Fallo interno simulado');
    for (let index = 0; index < 6; index++) {
      await expect(
        limits.run('login', email, async () => {
          throw error;
        }),
      ).rejects.toBe(error);
    }
    await expect(limits.run('login', email, succeed)).resolves.toEqual({
      ok: true,
    });
  });
});
