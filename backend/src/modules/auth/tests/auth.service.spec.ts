import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service.js';
import {
  InvalidCredentialsException,
  RoleNotAssignedException,
  InvalidResetCodeException,
  ExpiredResetCodeException,
  TooManyAttemptsException,
} from '../exceptions/index.js';

describe('AuthService', () => {
  const authRepository = {
    findUserByEmailWithRoles: vi.fn(),
    existsByEmail: vi.fn(),
    findUserByEmail: vi.fn(),
    createPasswordResetOtp: vi.fn(),
    findLatestValidOtp: vi.fn(),
    incrementOtpAttempts: vi.fn(),
    markOtpUsed: vi.fn(),
    updateUserPasswordAndInvalidateOtp: vi.fn(),
  };
  const jwtService = { sign: vi.fn() };
  const mailerService = { sendPasswordResetCode: vi.fn() };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(authRepository as any, jwtService as any, mailerService as any);
  });

  it.each([true, false])('existsByEmail delega en el repository y devuelve %s', async (exists) => {
    authRepository.existsByEmail.mockResolvedValue(exists);

    await expect(service.existsByEmail('ana@umss.edu.bo')).resolves.toBe(exists);
    expect(authRepository.existsByEmail).toHaveBeenCalledWith('ana@umss.edu.bo');
  });

  it('lanza InvalidCredentialsException si el usuario no existe', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue(null);
    await expect(
      service.login({ email: 'no-existe@umss.edu.bo', password: 'Prueba123', roleTag: 'titulado' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza InvalidCredentialsException si el usuario no tiene password', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({ id: '1', password: null, roles: [] });
    await expect(
      service.login({ email: 'prueba@umss.edu.bo', password: 'Prueba123', roleTag: 'titulado' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza InvalidCredentialsException si la contrasena no coincide', async () => {
    const password = await bcrypt.hash('otra-contrasena', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: '1', password, roles: [{ role: { name: 'titulado' } }],
    });
    await expect(
      service.login({ email: 'prueba@umss.edu.bo', password: 'Prueba123', roleTag: 'titulado' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza RoleNotAssignedException si el usuario no tiene el rol solicitado', async () => {
    const password = await bcrypt.hash('Prueba123', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: '1', password, roles: [{ role: { name: 'mentor' } }],
    });
    await expect(
      service.login({ email: 'prueba@umss.edu.bo', password: 'Prueba123', roleTag: 'titulado' }),
    ).rejects.toBeInstanceOf(RoleNotAssignedException);
  });

  it('devuelve el accessToken y el roleTag cuando todo es correcto', async () => {
    const password = await bcrypt.hash('Prueba123', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'user-1', password, roles: [{ role: { name: 'titulado' } }],
    });
    jwtService.sign.mockReturnValue('token-firmado');

    const result = await service.login({ email: 'prueba@umss.edu.bo', password: 'Prueba123', roleTag: 'titulado' });

    expect(result).toEqual({ accessToken: 'token-firmado', roleTag: 'titulado', roles: ['titulado'] });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user-1', roleTag: 'titulado', roles: ['titulado'] });
  });

  it('logs in with credentials and includes every assigned role without duplicates', async () => {
    const password = await bcrypt.hash('Prueba123', 4);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'u-1', isActive: true, password,
      roles: [{ role: { name: 'mentor' } }, { role: { name: 'titulado' } }, { role: { name: 'mentor' } }],
    });
    jwtService.sign.mockReturnValue('multi-role-token');
    await expect(service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' })).resolves.toEqual({
      accessToken: 'multi-role-token', roleTag: 'titulado', roles: ['titulado', 'mentor'],
    });
    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'u-1', roleTag: 'titulado', roles: ['titulado', 'mentor'] });
  });

  it('rejects an inactive user before issuing a token', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({ id: 'u-1', isActive: false, password: 'hash', roles: [] });
    await expect(service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' })).rejects.toBeInstanceOf(InvalidCredentialsException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects an account without active roles', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({ id: 'u-1', password: await bcrypt.hash('Prueba123', 4), roles: [] });
    await expect(service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' })).rejects.toBeInstanceOf(RoleNotAssignedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('returns the verified session roles', () => {
    expect(service.getSession({ id: 'u-1', email: 'ana@umss.edu.bo', roles: ['titulado', 'mentor'] })).toEqual({
      id: 'u-1', email: 'ana@umss.edu.bo', roles: ['titulado', 'mentor'],
    });
  });

  describe('requestPasswordReset', () => {
    it('envía correo y guarda OTP si el usuario existe y está activo', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
        firstName: 'Juan',
        lastName: 'Perez',
        isActive: true,
      });

      const res = await service.requestPasswordReset({ email: 'user@umss.edu' });

      expect(res.ok).toBe(true);
      expect(authRepository.createPasswordResetOtp).toHaveBeenCalled();
      expect(mailerService.sendPasswordResetCode).toHaveBeenCalledWith(
        'user@umss.edu',
        expect.stringMatching(/^\d{6}$/),
        'Juan Perez',
      );
    });

    it('retorna ok genérico si el usuario no existe para no filtrar correos', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const res = await service.requestPasswordReset({ email: 'desconocido@umss.edu' });

      expect(res.ok).toBe(true);
      expect(authRepository.createPasswordResetOtp).not.toHaveBeenCalled();
      expect(mailerService.sendPasswordResetCode).not.toHaveBeenCalled();
    });
  });

  describe('verifyPasswordReset', () => {
    it('valida el código correctamente cuando coincide y no ha expirado', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({ id: 'u-123', email: 'user@umss.edu' });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      });

      const res = await service.verifyPasswordReset({ email: 'user@umss.edu', code });

      expect(res.ok).toBe(true);
    });

    it('lanza InvalidResetCodeException si el código no coincide e incrementa intentos', async () => {
      const codeHash = await bcrypt.hash('654321', 4);
      authRepository.findUserByEmail.mockResolvedValue({ id: 'u-123', email: 'user@umss.edu' });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      });

      await expect(service.verifyPasswordReset({ email: 'user@umss.edu', code: '123456' })).rejects.toBeInstanceOf(
        InvalidResetCodeException,
      );
      expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith('otp-1');
    });

    it('lanza ExpiredResetCodeException si el código ya expiró', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({ id: 'u-123', email: 'user@umss.edu' });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(service.verifyPasswordReset({ email: 'user@umss.edu', code })).rejects.toBeInstanceOf(
        ExpiredResetCodeException,
      );
    });

    it('lanza TooManyAttemptsException si ha superado los 5 intentos', async () => {
      authRepository.findUserByEmail.mockResolvedValue({ id: 'u-123', email: 'user@umss.edu' });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hash',
        expiresAt: new Date(Date.now() + 600000),
        attempts: 5,
      });

      await expect(service.verifyPasswordReset({ email: 'user@umss.edu', code: '123456' })).rejects.toBeInstanceOf(
        TooManyAttemptsException,
      );
    });
  });

  describe('resetPassword', () => {
    it('hashea la nueva contraseña y actualiza el usuario e invalida el OTP', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({ id: 'u-123', email: 'user@umss.edu' });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 600000),
        attempts: 0,
      });

      const res = await service.resetPassword({
        email: 'user@umss.edu',
        code,
        password: 'NuevaContrasena1',
      });

      expect(res.ok).toBe(true);
      expect(authRepository.updateUserPasswordAndInvalidateOtp).toHaveBeenCalledWith(
        'u-123',
        expect.any(String),
        'otp-1',
      );
    });
  });
});
