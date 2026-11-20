import type { PasswordHistoryService } from '../services/password-history.service.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../services/auth.service.js';
import {
  InvalidCredentialsException,
  RoleNotAssignedException,
  InvalidResetCodeException,
  ExpiredResetCodeException,
  TooManyAttemptsException,
  GoogleEmailMismatchException,
  GoogleAccountAlreadyLinkedException,
} from '../exceptions/index.js';

describe('AuthService', () => {
  const authRepository = {
    findUserByEmailWithRoles: vi.fn(),
    findUserByGoogleSubWithRoles: vi.fn(),
    findGoogleSocialAccountBySub: vi.fn(),
    linkGoogleAccount: vi.fn(),
    existsByEmail: vi.fn(),
    findUserByEmail: vi.fn(),
    createPasswordResetOtp: vi.fn(),
    findLatestOtp: vi.fn(),
    findLatestValidOtp: vi.fn(),
    incrementOtpAttempts: vi.fn(),
    markOtpUsed: vi.fn(),
    updateUserPasswordAndInvalidateOtp: vi.fn(),
  };
  const jwtService = { sign: vi.fn() };
  const mailService = { send: vi.fn().mockResolvedValue(undefined) };
  const refreshTokenService = {
    revokeAllForUser: vi.fn(),
  };
  const passwordHistory = {
    validateNewPassword: vi.fn().mockResolvedValue('observed-hash'),
  };
  let service: AuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new AuthService(
      authRepository as any,
      jwtService as any,
      mailService as any,
      refreshTokenService as any,
      passwordHistory as unknown as PasswordHistoryService,
    );
  });

  it.each([true, false])(
    'existsByEmail delega en el repository y devuelve %s',
    async (exists) => {
      authRepository.existsByEmail.mockResolvedValue(exists);

      await expect(service.existsByEmail('ana@umss.edu.bo')).resolves.toBe(
        exists,
      );
      expect(authRepository.existsByEmail).toHaveBeenCalledWith(
        'ana@umss.edu.bo',
      );
    },
  );

  it('lanza InvalidCredentialsException si el usuario no existe', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue(null);
    await expect(
      service.login({
        email: 'no-existe@umss.edu.bo',
        password: 'Prueba123',
        roleTag: 'titulado',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza InvalidCredentialsException si el usuario no tiene password', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: '1',
      password: null,
      roles: [],
    });
    await expect(
      service.login({
        email: 'prueba@umss.edu.bo',
        password: 'Prueba123',
        roleTag: 'titulado',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza InvalidCredentialsException si la contrasena no coincide', async () => {
    const password = await bcrypt.hash('otra-contrasena', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: '1',
      password,
      roles: [{ role: { name: 'titulado' } }],
    });
    await expect(
      service.login({
        email: 'prueba@umss.edu.bo',
        password: 'Prueba123',
        roleTag: 'titulado',
      }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
  });

  it('lanza RoleNotAssignedException si el usuario no tiene el rol solicitado', async () => {
    const password = await bcrypt.hash('Prueba123', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: '1',
      password,
      roles: [{ role: { name: 'mentor' } }],
    });
    await expect(
      service.login({
        email: 'prueba@umss.edu.bo',
        password: 'Prueba123',
        roleTag: 'titulado',
      }),
    ).rejects.toBeInstanceOf(RoleNotAssignedException);
  });

  it('devuelve el accessToken y el roleTag cuando todo es correcto', async () => {
    const password = await bcrypt.hash('Prueba123', 10);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'user-1',
      password,
      roles: [{ role: { name: 'titulado' } }],
    });
    jwtService.sign.mockReturnValue('token-firmado');

    const result = await service.login({
      email: 'prueba@umss.edu.bo',
      password: 'Prueba123',
      roleTag: 'titulado',
    });

    expect(result).toEqual({
      accessToken: 'token-firmado',
      roleTag: 'titulado',
      roles: ['titulado'],
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      roleTag: 'titulado',
      roles: ['titulado'],
    });
  });

  it('logs in with credentials and includes every assigned role without duplicates', async () => {
    const password = await bcrypt.hash('Prueba123', 4);
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'u-1',
      isActive: true,
      password,
      roles: [
        { role: { name: 'mentor' } },
        { role: { name: 'titulado' } },
        { role: { name: 'mentor' } },
      ],
    });
    jwtService.sign.mockReturnValue('multi-role-token');
    await expect(
      service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' }),
    ).resolves.toEqual({
      accessToken: 'multi-role-token',
      roleTag: 'titulado',
      roles: ['titulado', 'mentor'],
    });
    expect(jwtService.sign).toHaveBeenCalledWith({
      sub: 'u-1',
      roleTag: 'titulado',
      roles: ['titulado', 'mentor'],
    });
  });

  it('rejects an inactive user before issuing a token', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'u-1',
      isActive: false,
      password: 'hash',
      roles: [],
    });
    await expect(
      service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' }),
    ).rejects.toBeInstanceOf(InvalidCredentialsException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('rejects an account without active roles', async () => {
    authRepository.findUserByEmailWithRoles.mockResolvedValue({
      id: 'u-1',
      password: await bcrypt.hash('Prueba123', 4),
      roles: [],
    });
    await expect(
      service.login({ email: 'ana@umss.edu.bo', password: 'Prueba123' }),
    ).rejects.toBeInstanceOf(RoleNotAssignedException);
    expect(jwtService.sign).not.toHaveBeenCalled();
  });

  it('returns the verified session roles', () => {
    expect(
      service.getSession({
        id: 'u-1',
        email: 'ana@umss.edu.bo',
        roles: ['titulado', 'mentor'],
      }),
    ).toEqual({
      id: 'u-1',
      email: 'ana@umss.edu.bo',
      roles: ['titulado', 'mentor'],
      company: null,
      idleTimeoutSeconds: 900,
      warningSeconds: 180,
      absoluteExpiresAt: null,
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
      authRepository.findLatestOtp.mockResolvedValue(null);

      const res = await service.requestPasswordReset({
        email: 'user@umss.edu',
      });

      expect(res.ok).toBe(true);
      expect(res.message).toBe(
        'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
      );
      expect(authRepository.createPasswordResetOtp).toHaveBeenCalled();
      expect(mailService.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'user@umss.edu',
          mjml: expect.any(String),
          values: expect.objectContaining({ recipientName: 'Juan Perez' }),
        }),
      );
    });

    it('retorna la misma respuesta genérica si el usuario no existe para no filtrar correos', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      const res = await service.requestPasswordReset({
        email: 'desconocido@umss.edu',
      });

      expect(res.ok).toBe(true);
      expect(res.message).toBe(
        'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
      );
      expect(authRepository.createPasswordResetOtp).not.toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
    });

    it('retorna respuesta genérica sin enviar correo si se solicita dentro del cooldown de 2 minutos', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
        firstName: 'Juan',
        lastName: 'Perez',
        isActive: true,
      });

      authRepository.findLatestOtp.mockResolvedValue({
        id: 'otp-recent',
        createdAt: new Date(Date.now() - 30 * 1000),
      });

      const res = await service.requestPasswordReset({
        email: 'user@umss.edu',
      });
      expect(res.ok).toBe(true);
      expect(res.message).toBe(
        'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
      );
      expect(authRepository.createPasswordResetOtp).not.toHaveBeenCalled();
      expect(mailService.send).not.toHaveBeenCalled();
    });
    it('permite solicitar nuevo código si ya pasaron más de 2 minutos', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
        firstName: 'Juan',
        lastName: 'Perez',
        isActive: true,
      });

      authRepository.findLatestOtp.mockResolvedValue({
        id: 'otp-old',
        createdAt: new Date(Date.now() - 130 * 1000),
      });

      const res = await service.requestPasswordReset({
        email: 'user@umss.edu',
      });

      expect(res.ok).toBe(true);
      expect(authRepository.createPasswordResetOtp).toHaveBeenCalled();
      expect(mailService.send).toHaveBeenCalled();
    });
  });

  describe('verifyPasswordReset', () => {
    it('valida el código correctamente cuando coincide y no ha expirado', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });

      const res = await service.verifyPasswordReset({
        email: 'user@umss.edu',
        code,
      });

      expect(res.ok).toBe(true);
    });

    it('lanza InvalidResetCodeException si el código no coincide e incrementa intentos', async () => {
      const codeHash = await bcrypt.hash('654321', 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });

      await expect(
        service.verifyPasswordReset({ email: 'user@umss.edu', code: '123456' }),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
      expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith('otp-1');
    });

    it('lanza ExpiredResetCodeException si el código ya expiró', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(
        service.verifyPasswordReset({ email: 'user@umss.edu', code }),
      ).rejects.toBeInstanceOf(ExpiredResetCodeException);
    });

    it('lanza TooManyAttemptsException si ha superado los 5 intentos', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hash',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 5,
      });

      await expect(
        service.verifyPasswordReset({ email: 'user@umss.edu', code: '123456' }),
      ).rejects.toBeInstanceOf(TooManyAttemptsException);
    });
  });

  describe('resetPassword', () => {
    it('hashea la nueva contraseña y actualiza el usuario e invalida el OTP', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });

      const res = await service.resetPassword({
        email: 'user@umss.edu',
        code,
        password: 'NuevaContrasena1',
      });

      expect(res.ok).toBe(true);
      expect(
        authRepository.updateUserPasswordAndInvalidateOtp,
      ).toHaveBeenCalledWith('u-123', expect.any(String), 'otp-1', 'observed-hash');
    });

    it('lanza InvalidResetCodeException si el usuario no existe', async () => {
      authRepository.findUserByEmail.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'inexistente@umss.edu',
          code: '123456',
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
    });

    it('lanza InvalidResetCodeException si no hay OTP válido para el usuario', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'user@umss.edu',
          code: '123456',
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
    });

    it('lanza InvalidResetCodeException e incrementa intentos si el código no coincide', async () => {
      const codeHash = await bcrypt.hash('654321', 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() + 300000),
        attempts: 0,
      });

      await expect(
        service.resetPassword({
          email: 'user@umss.edu',
          code: '111111',
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(InvalidResetCodeException);
      expect(authRepository.incrementOtpAttempts).toHaveBeenCalledWith('otp-1');
    });

    it('lanza ExpiredResetCodeException si el código está vencido al resetear la contraseña', async () => {
      const code = '123456';
      const codeHash = await bcrypt.hash(code, 4);
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash,
        expiresAt: new Date(Date.now() - 1000),
        attempts: 0,
      });

      await expect(
        service.resetPassword({
          email: 'user@umss.edu',
          code,
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(ExpiredResetCodeException);
    });

    it('lanza TooManyAttemptsException si ha superado los intentos al resetear la contraseña', async () => {
      authRepository.findUserByEmail.mockResolvedValue({
        id: 'u-123',
        email: 'user@umss.edu',
      });
      authRepository.findLatestValidOtp.mockResolvedValue({
        id: 'otp-1',
        codeHash: 'hash',
        expiresAt: new Date(Date.now() + 300000),
        attempts: 5,
      });

      await expect(
        service.resetPassword({
          email: 'user@umss.edu',
          code: '123456',
          password: 'Password1',
        }),
      ).rejects.toBeInstanceOf(TooManyAttemptsException);
    });
  });

  describe('loginWithGoogle', () => {
    const verifiedGoogle = {
      email: 'dania@umss.edu',
      sub: 'google-sub-123',
      picture: 'https://photo.url',
    };

    it('1. Usuario registrado, activo y con rol permitido: inicia sesión exitosamente', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findUserByEmailWithRoles.mockResolvedValue({
        id: 'u-1',
        email: 'dania@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'titulado' } }],
      });
      authRepository.findGoogleSocialAccountBySub.mockResolvedValue(null);
      authRepository.linkGoogleAccount.mockResolvedValue({});
      jwtService.sign.mockReturnValue('jwt-token-123');

      const result = await service.loginWithGoogle(verifiedGoogle);

      expect(authRepository.linkGoogleAccount).toHaveBeenCalledWith(
        'u-1',
        'google-sub-123',
        'dania@umss.edu',
        'https://photo.url',
      );
      expect(result).toEqual({
        accessToken: 'jwt-token-123',
        roleTag: 'titulado',
        roles: ['titulado'],
      });
    });

    it('2. Usuario no registrado: rechaza el acceso sin crear cuenta automáticamente', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findUserByEmailWithRoles.mockResolvedValue(null);

      await expect(
        service.loginWithGoogle({
          email: 'noexiste@gmail.com',
          sub: 'unknown-sub',
        }),
      ).rejects.toBeInstanceOf(InvalidCredentialsException);

      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('3. Usuario inactivo: rechaza el acceso si la cuenta está deshabilitada', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findUserByEmailWithRoles.mockResolvedValue({
        id: 'u-inactivo',
        email: 'inactivo@umss.edu',
        isActive: false,
        roles: [{ role: { name: 'titulado' } }],
      });

      await expect(
        service.loginWithGoogle({
          email: 'inactivo@umss.edu',
          sub: 'inactivo-sub',
        }),
      ).rejects.toThrow(
        'Esta cuenta de usuario se encuentra inactiva o deshabilitada.',
      );
    });

    it('4. Usuario con rol no permitido: rechaza acceso a administrativo o empresa', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findUserByEmailWithRoles.mockResolvedValue({
        id: 'u-admin',
        email: 'admin@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'administrativo' } }],
      });

      await expect(
        service.loginWithGoogle({
          email: 'admin@umss.edu',
          sub: 'admin-sub',
        }),
      ).rejects.toBeInstanceOf(RoleNotAssignedException);
    });

    it('8. Inicio de sesión posterior usando la vinculación persistida por Google sub', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue({
        id: 'u-1',
        email: 'dania@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'estudiante' } }],
      });
      jwtService.sign.mockReturnValue('sub-session-token');

      const result = await service.loginWithGoogle({
        email: 'dania@umss.edu',
        sub: 'google-sub-123',
      });

      expect(authRepository.findUserByGoogleSubWithRoles).toHaveBeenCalledWith(
        'google-sub-123',
      );
      expect(result).toEqual({
        accessToken: 'sub-session-token',
        roleTag: 'estudiante',
        roles: ['estudiante'],
      });
    });

    it('9. Error si la identidad de Google ya está vinculada a otro usuario', async () => {
      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findUserByEmailWithRoles.mockResolvedValue({
        id: 'u-2',
        email: 'otro@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'titulado' } }],
      });
      authRepository.findGoogleSocialAccountBySub.mockResolvedValue({
        id: 'link-1',
        userId: 'u-1', // Perteneciente a otro usuario
      });

      await expect(
        service.loginWithGoogle({
          email: 'otro@umss.edu',
          sub: 'google-sub-belonging-to-u1',
        }),
      ).rejects.toThrow(
        'Esta cuenta de Google ya está vinculada a otro usuario.',
      );
    });
  });

  describe('linkGoogle', () => {
    const authUser = {
      id: 'u-1',
      email: 'dania@umss.edu',
      roles: ['titulado'],
    };

    it('5. Cuenta Google diferente de la cuenta que se desea vincular: rechaza con 400', async () => {
      await expect(
        service.linkGoogle(authUser as any, {
          email: 'otra_cuenta@gmail.com',
          sub: 'sub-123',
        }),
      ).rejects.toThrow(
        'La cuenta de Google no coincide con el correo de tu cuenta registrada.',
      );
      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('4b. Usuario con rol no permitido no puede vincular cuenta', async () => {
      const adminUser = {
        id: 'u-admin',
        email: 'admin@umss.edu',
        roles: ['administrativo'],
      };
      authRepository.findUserByEmailWithRoles.mockResolvedValueOnce({
        id: 'u-admin',
        email: 'admin@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'administrativo' } }],
      });

      await expect(
        service.linkGoogle(adminUser as any, {
          email: 'admin@umss.edu',
          sub: 'sub-admin',
        }),
      ).rejects.toBeInstanceOf(RoleNotAssignedException);
      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('4c. Cuenta no registrada en base de datos: rechaza la vinculación', async () => {
      authRepository.findUserByEmailWithRoles.mockResolvedValueOnce(null);

      await expect(
        service.linkGoogle(authUser as any, {
          email: 'dania@umss.edu',
          sub: 'sub-dania',
        }),
      ).rejects.toThrow(
        'Esta cuenta de Google no está registrada en el sistema.',
      );
      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('4d. Cuenta inactiva o deshabilitada en base de datos: rechaza la vinculación', async () => {
      authRepository.findUserByEmailWithRoles.mockResolvedValueOnce({
        id: 'u-1',
        email: 'dania@umss.edu',
        isActive: false,
        roles: [{ role: { name: 'titulado' } }],
      });

      await expect(
        service.linkGoogle(authUser as any, {
          email: 'dania@umss.edu',
          sub: 'sub-dania',
        }),
      ).rejects.toThrow(
        'Esta cuenta de usuario se encuentra inactiva o deshabilitada.',
      );
      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('6. Identidad Google ya vinculada a otro usuario: lanza excepción y no vincula', async () => {
      authRepository.findUserByEmailWithRoles.mockResolvedValueOnce({
        id: 'u-1',
        email: 'dania@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'titulado' } }],
      });
      authRepository.findGoogleSocialAccountBySub.mockResolvedValueOnce({
        id: 'other-link',
        userId: 'u-otro-usuario',
      });

      await expect(
        service.linkGoogle(authUser as any, {
          email: 'dania@umss.edu',
          sub: 'sub-belonging-to-other',
        }),
      ).rejects.toThrow(
        'Esta cuenta de Google ya está vinculada a otro usuario.',
      );
      expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
    });

    it('7. Vinculación exitosa y persistida: guarda en repositorio atómicamente', async () => {
      authRepository.findUserByEmailWithRoles.mockResolvedValueOnce({
        id: 'u-1',
        email: 'dania@umss.edu',
        isActive: true,
        roles: [{ role: { name: 'titulado' } }],
      });
      authRepository.findGoogleSocialAccountBySub.mockResolvedValueOnce(null);
      authRepository.linkGoogleAccount.mockResolvedValueOnce({ id: 'link-1' });

      const result = await service.linkGoogle(authUser as any, {
        email: 'dania@umss.edu',
        sub: 'sub-dania',
        picture: 'https://photo.url',
      });

      expect(authRepository.linkGoogleAccount).toHaveBeenCalledWith(
        'u-1',
        'sub-dania',
        'dania@umss.edu',
        'https://photo.url',
      );
      expect(result).toEqual({
        ok: true,
        detail: 'Cuenta vinculada exitosamente.',
      });
    });
  });

  describe('regresión: login Google rechazado no guarda vinculación', () => {
    beforeEach(() => {
      authRepository.findUserByGoogleSubWithRoles.mockReset();
      authRepository.findUserByEmailWithRoles.mockReset();
      authRepository.findGoogleSocialAccountBySub.mockReset();
      authRepository.linkGoogleAccount.mockReset();
      jwtService.sign.mockReset();

      authRepository.findUserByGoogleSubWithRoles.mockResolvedValue(null);
      authRepository.findGoogleSocialAccountBySub.mockResolvedValue(null);
    });

    it.each([
      {
        scenario: 'cuenta inactiva',
        isActive: false,
        role: 'titulado',
        requestedRole: undefined,
        exception: InvalidCredentialsException,
      },
      {
        scenario: 'rol empresa',
        isActive: true,
        role: 'empresa',
        requestedRole: undefined,
        exception: RoleNotAssignedException,
      },
      {
        scenario: 'rol administrativo',
        isActive: true,
        role: 'administrativo',
        requestedRole: undefined,
        exception: RoleNotAssignedException,
      },
      {
        scenario: 'rol solicitado no asignado',
        isActive: true,
        role: 'titulado',
        requestedRole: 'mentor',
        exception: RoleNotAssignedException,
      },
    ] as const)(
      'rechaza $scenario sin vincular ni emitir token',
      async ({ isActive, role, requestedRole, exception }) => {
        authRepository.findUserByEmailWithRoles.mockResolvedValue({
          id: 'google-regression-user',
          isActive,
          roles: [{ role: { name: role } }],
        });

        await expect(
          service.loginWithGoogle(
            {
              email: 'regresion@umssy.test',
              sub: 'google-regression-sub',
            },
            requestedRole,
          ),
        ).rejects.toBeInstanceOf(exception);

        expect(authRepository.linkGoogleAccount).not.toHaveBeenCalled();
        expect(jwtService.sign).not.toHaveBeenCalled();
      },
    );

    it('no emite token si falla la persistencia de la vinculación', async () => {
      authRepository.findUserByEmailWithRoles.mockResolvedValue({
        id: 'google-regression-user',
        isActive: true,
        roles: [{ role: { name: 'titulado' } }],
      });
      authRepository.linkGoogleAccount.mockRejectedValue(
        new Error('Fallo de persistencia'),
      );

      await expect(
        service.loginWithGoogle({
          email: 'regresion@umssy.test',
          sub: 'google-regression-sub',
        }),
      ).rejects.toThrow('Fallo de persistencia');

      expect(authRepository.linkGoogleAccount).toHaveBeenCalledTimes(1);
      expect(jwtService.sign).not.toHaveBeenCalled();
    });
  });

});
