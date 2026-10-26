import * as bcrypt from 'bcrypt';
import { Logger } from '@nestjs/common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  AccountAlreadyActivatedException,
  ActivationAttemptsExceededException,
  ActivationCodeExpiredException,
  ActivationCodeNotSentException,
  ActivationRequestNotFoundException,
  InvalidActivationCodeException,
  ResendLimitExceededException,
  ResendTooSoonException,
} from '../exceptions/index.js';
import { AccountActivationService } from '../services/account-activation.service.js';

const NOW = new Date('2026-10-05T12:00:00.000Z');
const MINUTE = 60_000;
const CODE = '482719';
const CODE_HASH = bcrypt.hashSync(CODE, 4);
const EMAIL = 'ana@umss.test';
const REQUEST = { id: 'req-1', firstName: 'Ana', lastName: 'Pérez', email: EMAIL, phone: '71234567' };

function otpRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'otp-1',
    accessRequestId: 'req-1',
    codeHash: CODE_HASH,
    expiresAt: new Date(NOW.getTime() + 5 * MINUTE),
    attempts: 0,
    usedAt: null,
    createdAt: new Date(NOW.getTime() - 2 * MINUTE),
    ...overrides,
  };
}

function build(options: { request?: unknown; otp?: unknown; userExists?: boolean; resends?: number } = {}) {
  const { request = REQUEST, otp = otpRow(), userExists = false, resends = 0 } = options;
  const activationRepository = {
    findApprovedRequestByEmail: vi.fn().mockResolvedValue(request),
    userExistsByEmail: vi.fn().mockResolvedValue(userExists),
    createUserAndConsumeOtp: vi.fn().mockResolvedValue('created'),
  };
  const otpRepository = {
    findLatestByRequest: vi.fn().mockResolvedValue(otp),
    incrementAttempts: vi.fn().mockResolvedValue({ attempts: 1 }),
    invalidate: vi.fn().mockResolvedValue(undefined),
    countResendsSince: vi.fn().mockResolvedValue(resends),
  };
  const otpService = { issueFor: vi.fn().mockResolvedValue(true) };
  const session = { accessToken: 'jwt', roleTag: 'titulado', roles: ['titulado'] };
  const authService = { login: vi.fn().mockResolvedValue(session) };
  const mail = { sendAccountActivated: vi.fn().mockResolvedValue(undefined) };
  const service = new AccountActivationService(
    activationRepository as any,
    otpRepository as any,
    otpService as any,
    authService as any,
    mail as any,
  );
  return { activationRepository, otpRepository, otpService, authService, mail, session, service };
}

afterEach(() => vi.restoreAllMocks());

describe('AccountActivationService.getStatus', () => {
  it('con un código vigente informa vencimiento, espera de reenvío y contadores', async () => {
    const { service, otpRepository } = build({ otp: otpRow({ attempts: 2 }), resends: 1 });

    const status = await service.getStatus(EMAIL, NOW);

    expect(status).toEqual({
      state: 'ready',
      expiresAt: '2026-10-05T12:05:00.000Z',
      resendAvailableAt: '2026-10-05T11:59:00.000Z',
      resendsRemaining: 2,
      remainingAttempts: 3,
    });
    expect(otpRepository.countResendsSince).toHaveBeenCalledWith('req-1', new Date('2026-10-05T11:00:00.000Z'));
  });

  it('marca el código como vencido cuando ya pasó su hora', async () => {
    const { service } = build({ otp: otpRow({ expiresAt: NOW }) });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({ state: 'expired' });
  });

  it('marca bloqueo por intentos aunque el código también esté invalidado', async () => {
    const { service } = build({ otp: otpRow({ attempts: 5, expiresAt: NOW }) });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({ state: 'locked', remainingAttempts: 0 });
  });

  it('sin ningún código informa no_code y permite reenviar de inmediato', async () => {
    const { service } = build({ otp: null });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({
      state: 'no_code',
      expiresAt: null,
      resendAvailableAt: '2026-10-05T12:01:00.000Z',
    });
  });

  it('no deja reenvíos cuando ya se usaron los 3 de la hora', async () => {
    const { service } = build({ resends: 3 });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({ resendsRemaining: 0 });
  });

  it('informa cuenta activada si el código ya se usó', async () => {
    const { service } = build({ otp: otpRow({ usedAt: NOW }) });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({ state: 'activated', expiresAt: null });
  });

  it('informa cuenta activada si ya existe un usuario con ese correo', async () => {
    const { service } = build({ userExists: true });
    await expect(service.getStatus(EMAIL, NOW)).resolves.toMatchObject({ state: 'activated' });
  });

  it('responde 404 cuando el correo no tiene una solicitud aprobada', async () => {
    const { service } = build({ request: null });
    await expect(service.getStatus(EMAIL, NOW)).rejects.toBeInstanceOf(ActivationRequestNotFoundException);
  });
});

describe('AccountActivationService.verify', () => {
  it('acepta el código correcto sin gastar intentos', async () => {
    const { service, otpRepository } = build();

    await expect(service.verify(EMAIL, CODE, NOW)).resolves.toEqual({ valid: true, expiresAt: '2026-10-05T12:05:00.000Z' });
    expect(otpRepository.incrementAttempts).not.toHaveBeenCalled();
  });

  it('con un código incorrecto suma un intento e informa cuántos quedan', async () => {
    const { service, otpRepository } = build();

    const result = service.verify(EMAIL, '000000', NOW);

    await expect(result).rejects.toBeInstanceOf(InvalidActivationCodeException);
    await expect(result).rejects.toMatchObject({
      statusCode: 400,
      data: { reason: 'code_invalid', remainingAttempts: 4 },
    });
    expect(otpRepository.incrementAttempts).toHaveBeenCalledWith('otp-1');
  });

  it('al quinto intento fallido invalida el código y bloquea', async () => {
    const { service, otpRepository } = build({ otp: otpRow({ attempts: 4 }) });
    otpRepository.incrementAttempts.mockResolvedValue({ attempts: 5 });

    await expect(service.verify(EMAIL, '000000', NOW)).rejects.toBeInstanceOf(ActivationAttemptsExceededException);
    expect(otpRepository.invalidate).toHaveBeenCalledWith('otp-1', NOW);
  });

  it('un código ya bloqueado no se vuelve a comparar ni suma intentos', async () => {
    const { service, otpRepository } = build({ otp: otpRow({ attempts: 5, expiresAt: NOW }) });

    await expect(service.verify(EMAIL, CODE, NOW)).rejects.toBeInstanceOf(ActivationAttemptsExceededException);
    expect(otpRepository.incrementAttempts).not.toHaveBeenCalled();
  });

  it('rechaza un código vencido aunque coincida', async () => {
    const { service, otpRepository } = build({ otp: otpRow({ expiresAt: new Date(NOW.getTime() - 1) }) });

    await expect(service.verify(EMAIL, CODE, NOW)).rejects.toBeInstanceOf(ActivationCodeExpiredException);
    expect(otpRepository.incrementAttempts).not.toHaveBeenCalled();
  });

  it('sin ningún código emitido pide solicitar uno nuevo', async () => {
    const { service } = build({ otp: null });
    await expect(service.verify(EMAIL, CODE, NOW)).rejects.toBeInstanceOf(ActivationCodeExpiredException);
  });

  it('si la cuenta ya fue activada responde 409', async () => {
    const { service } = build({ otp: otpRow({ usedAt: NOW }) });
    const result = service.verify(EMAIL, CODE, NOW);

    await expect(result).rejects.toBeInstanceOf(AccountAlreadyActivatedException);
    await expect(result).rejects.toMatchObject({ statusCode: 409, data: { reason: 'already_activated' } });
  });

  it('responde 404 cuando el correo no tiene una solicitud aprobada', async () => {
    const { service } = build({ request: null });
    await expect(service.verify(EMAIL, CODE, NOW)).rejects.toBeInstanceOf(ActivationRequestNotFoundException);
  });
});

describe('AccountActivationService.activate', () => {
  it('crea el usuario con la contraseña cifrada, avisa por correo y devuelve la sesión', async () => {
    const { service, activationRepository, authService, mail, session } = build();

    await expect(service.activate(EMAIL, CODE, 'Jackson2026', NOW)).resolves.toBe(session);

    const [otpId, user, usedAt] = activationRepository.createUserAndConsumeOtp.mock.calls[0];
    expect(otpId).toBe('otp-1');
    expect(usedAt).toBe(NOW);
    expect(user).toMatchObject({ firstName: 'Ana', lastName: 'Pérez', email: EMAIL, phone: '71234567' });
    expect(user.passwordHash).not.toBe('Jackson2026');
    expect(await bcrypt.compare('Jackson2026', user.passwordHash)).toBe(true);
    expect(mail.sendAccountActivated).toHaveBeenCalledWith(EMAIL, 'Ana');
    expect(authService.login).toHaveBeenCalledWith({ email: EMAIL, password: 'Jackson2026' });
  });

  it('con un código incorrecto no crea ningún usuario', async () => {
    const { service, activationRepository, authService } = build();

    await expect(service.activate(EMAIL, '000000', 'Jackson2026', NOW)).rejects.toBeInstanceOf(
      InvalidActivationCodeException,
    );
    expect(activationRepository.createUserAndConsumeOtp).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('si el código se consumió en otro envío simultáneo responde que ya fue activada', async () => {
    const { service, activationRepository, authService, mail } = build();
    activationRepository.createUserAndConsumeOtp.mockResolvedValue('already_used');

    await expect(service.activate(EMAIL, CODE, 'Jackson2026', NOW)).rejects.toBeInstanceOf(
      AccountAlreadyActivatedException,
    );
    expect(mail.sendAccountActivated).not.toHaveBeenCalled();
    expect(authService.login).not.toHaveBeenCalled();
  });

  it('si falla el correo de confirmación la cuenta queda activada y la sesión se devuelve igual', async () => {
    const { service, mail, session } = build();
    const logError = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    mail.sendAccountActivated.mockRejectedValue(new Error('smtp caído'));

    await expect(service.activate(EMAIL, CODE, 'Jackson2026', NOW)).resolves.toBe(session);
    expect(logError).toHaveBeenCalledOnce();
  });

  it('con una cuenta ya activada no vuelve a crear usuario', async () => {
    const { service, activationRepository } = build({ userExists: true });

    await expect(service.activate(EMAIL, CODE, 'Jackson2026', NOW)).rejects.toBeInstanceOf(
      AccountAlreadyActivatedException,
    );
    expect(activationRepository.createUserAndConsumeOtp).not.toHaveBeenCalled();
  });
});

describe('AccountActivationService.resend', () => {
  it('emite un código nuevo e informa los nuevos tiempos y los reenvíos que quedan', async () => {
    const { service, otpService } = build({ resends: 0 });

    await expect(service.resend(EMAIL, NOW)).resolves.toEqual({
      expiresAt: '2026-10-05T12:10:00.000Z',
      resendAvailableAt: '2026-10-05T12:01:00.000Z',
      resendsRemaining: 2,
    });
    expect(otpService.issueFor).toHaveBeenCalledWith('req-1', EMAIL, NOW);
  });

  it('permite reenviar cuando todavía no se emitió ningún código', async () => {
    const { service, otpService } = build({ otp: null });

    await expect(service.resend(EMAIL, NOW)).resolves.toMatchObject({ resendsRemaining: 2 });
    expect(otpService.issueFor).toHaveBeenCalledOnce();
  });

  it('exige esperar 60 segundos desde el último código e indica cuánto falta', async () => {
    const { service, otpService } = build({ otp: otpRow({ createdAt: new Date(NOW.getTime() - 30_000) }) });
    const result = service.resend(EMAIL, NOW);

    await expect(result).rejects.toBeInstanceOf(ResendTooSoonException);
    await expect(result).rejects.toMatchObject({
      statusCode: 429,
      data: { reason: 'resend_cooldown', retryAfterSeconds: 30 },
    });
    expect(otpService.issueFor).not.toHaveBeenCalled();
  });

  it('bloquea al llegar a 3 reenvíos en la última hora', async () => {
    const { service, otpService } = build({ resends: 3 });
    const result = service.resend(EMAIL, NOW);

    await expect(result).rejects.toBeInstanceOf(ResendLimitExceededException);
    await expect(result).rejects.toMatchObject({
      message: 'Alcanzaste el límite de reenvíos, intenta nuevamente en 1 hora',
    });
    expect(otpService.issueFor).not.toHaveBeenCalled();
  });

  it('prioriza el límite por hora sobre la espera de 60 segundos', async () => {
    const { service } = build({ resends: 3, otp: otpRow({ createdAt: new Date(NOW.getTime() - 10_000) }) });
    await expect(service.resend(EMAIL, NOW)).rejects.toBeInstanceOf(ResendLimitExceededException);
  });

  it('si el correo no sale responde 502', async () => {
    const { service, otpService } = build();
    otpService.issueFor.mockResolvedValue(false);

    await expect(service.resend(EMAIL, NOW)).rejects.toBeInstanceOf(ActivationCodeNotSentException);
  });

  it('no reenvía a una cuenta ya activada', async () => {
    const { service, otpService } = build({ otp: otpRow({ usedAt: NOW }) });

    await expect(service.resend(EMAIL, NOW)).rejects.toBeInstanceOf(AccountAlreadyActivatedException);
    expect(otpService.issueFor).not.toHaveBeenCalled();
  });
});