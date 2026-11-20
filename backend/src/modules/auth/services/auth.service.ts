import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import crypto from 'node:crypto';
import { AuthRepository } from '../repositories/auth.repository.js';
import {
  InvalidCredentialsException,
  RoleNotAssignedException,
  InvalidResetCodeException,
  ExpiredResetCodeException,
  TooManyAttemptsException,
  GoogleEmailMismatchException,
} from '../exceptions/index.js';
import { LOGIN_ROLE_PRIORITY } from '../constants/login-role-priority.constants.js';
import type { RoleName } from '../../../common/enums/roles.enum.js';

export const GOOGLE_ALLOWED_ROLES: readonly RoleName[] = [
  'estudiante',
  'titulado',
  'mentor',
] as const;
import {
  SESSION_IDLE_SECONDS,
  SESSION_MAX_MS,
  SESSION_WARNING_SECONDS,
} from '../constants/session.constants.js';
import { MailService } from '../../mail/services/mail.service.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { RefreshTokenService } from './refresh-token.service.js';
import { PasswordHistoryService } from './password-history.service.js';
import type { SessionResponse } from '../types/session-response.types.js';
import type { LoginResponse } from '../types/login-response.types.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { LoginDto } from '../requests/login.schema.js';
import type { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import type { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import type { ResetPasswordDto } from '../requests/reset-password.schema.js';

import {
  MAX_OTP_ATTEMPTS,
  OTP_EXPIRATION_MINUTES,
  RESEND_COOLDOWN_SECONDS,
} from '../constants/password-reset.constants.js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly passwordHistory: PasswordHistoryService,
  ) {}

  existsByEmail(email: string) {
    return this.authRepository.existsByEmail(email);
  }

  getAccessTokenMaxAgeMs(accessToken: string): number {
    const payload = this.jwtService.decode<{ exp?: unknown } | null>(
      accessToken,
    );
    if (typeof payload?.exp !== 'number') return SESSION_MAX_MS;
    return Math.max(payload.exp * 1000 - Date.now(), 0);
  }

  getSession(
    user: AuthenticatedUser,
    absoluteExpiresAt: Date | null = null,
  ): SessionResponse {
    return {
      id: user.id,
      email: user.email,
      roles: user.roles,
      company: user.company ?? null,
      idleTimeoutSeconds: SESSION_IDLE_SECONDS,
      warningSeconds: SESSION_WARNING_SECONDS,
      absoluteExpiresAt: absoluteExpiresAt?.toISOString() ?? null,
    };
  }

  async login(dto: LoginDto): Promise<LoginResponse> {
    const user = await this.authRepository.findUserByEmailWithRoles(dto.email);

    if (!user || !user.password || user.isActive === false) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    const assignedRoles = new Set(user.roles.map(({ role }) => role.name));
    const roles = LOGIN_ROLE_PRIORITY.filter((role) => assignedRoles.has(role));
    const roleTag = dto.roleTag ?? roles[0];
    if (!roleTag || !roles.includes(roleTag)) {
      throw new RoleNotAssignedException(
        dto.roleTag ? undefined : 'El usuario no tiene roles habilitados',
      );
    }

    const accessToken = this.jwtService.sign({ sub: user.id, roleTag, roles });
    return { accessToken, roleTag, roles };
  }

  async loginWithGoogle(
    verifiedGoogle: { email: string; sub: string; picture?: string },
    requestedRoleTag?: RoleName,
  ): Promise<LoginResponse> {
    let user = await this.authRepository.findUserByGoogleSubWithRoles(
      verifiedGoogle.sub,
    );

    const needsGoogleLink = !user;

    if (!user) {
      user = await this.authRepository.findUserByEmailWithRoles(
        verifiedGoogle.email,
      );
      if (user) {
        const existingSub =
          await this.authRepository.findGoogleSocialAccountBySub(
            verifiedGoogle.sub,
          );
        if (existingSub && existingSub.userId !== user.id) {
          throw new InvalidCredentialsException(
            'Esta cuenta de Google ya está vinculada a otro usuario.',
          );
        }
      }
    }

    if (!user) {
      throw new InvalidCredentialsException(
        'Esta cuenta de Google no está registrada en el sistema.',
      );
    }

    if (user.isActive === false) {
      throw new InvalidCredentialsException(
        'Esta cuenta de usuario se encuentra inactiva o deshabilitada.',
      );
    }

    const assignedRoles = new Set(user.roles.map(({ role }) => role.name));
    const authorizedRoles = LOGIN_ROLE_PRIORITY.filter(
      (role) =>
        assignedRoles.has(role) && GOOGLE_ALLOWED_ROLES.includes(role as RoleName),
    );

    if (authorizedRoles.length === 0) {
      throw new RoleNotAssignedException(
        'El acceso con Google solo está permitido para estudiantes, titulados y mentores.',
      );
    }

    const roleTag = requestedRoleTag ?? authorizedRoles[0];
    if (!roleTag || !authorizedRoles.includes(roleTag)) {
      throw new RoleNotAssignedException(
        requestedRoleTag
          ? 'El rol seleccionado no está autorizado para acceder con Google.'
          : 'El usuario no tiene roles habilitados para acceder con Google.',
      );
    }

    if (needsGoogleLink) {
      await this.authRepository.linkGoogleAccount(
        user.id,
        verifiedGoogle.sub,
        verifiedGoogle.email,
        verifiedGoogle.picture,
      );
    }

    const accessToken = this.jwtService.sign({
      sub: user.id,
      roleTag,
      roles: authorizedRoles,
    });
    return { accessToken, roleTag, roles: authorizedRoles };
  }

  async linkGoogle(
    user: AuthenticatedUser,
    verifiedGoogle: { email: string; sub: string; picture?: string },
  ): Promise<{ ok: boolean; detail: string }> {
    // 1. Comprueba que la identidad Google corresponda al usuario autenticado
    if (
      user.email.trim().toLowerCase() !==
      verifiedGoogle.email.trim().toLowerCase()
    ) {
      throw new GoogleEmailMismatchException();
    }

    // 2. Verifica que la cuenta UMSSY exista en la base de datos
    const dbUser = await this.authRepository.findUserByEmailWithRoles(user.email);
    if (!dbUser) {
      throw new InvalidCredentialsException(
        'Esta cuenta de Google no está registrada en el sistema.',
      );
    }

    // 3. Comprueba que esté activa y habilitada
    if (dbUser.isActive === false) {
      throw new InvalidCredentialsException(
        'Esta cuenta de usuario se encuentra inactiva o deshabilitada.',
      );
    }

    // 4. Comprueba que tenga un rol permitido: estudiante, titulado o mentor
    const assignedRoles = new Set(dbUser.roles.map(({ role }) => role.name));
    const hasAllowedRole = GOOGLE_ALLOWED_ROLES.some((r) => assignedRoles.has(r));
    if (!hasAllowedRole) {
      throw new RoleNotAssignedException(
        'La vinculación con Google solo está permitida para estudiantes, titulados y mentores.',
      );
    }

    // 5. Verifica que la identidad Google no esté vinculada a otro usuario
    const existingLink = await this.authRepository.findGoogleSocialAccountBySub(
      verifiedGoogle.sub,
    );
    if (existingLink && existingLink.userId !== dbUser.id) {
      throw new InvalidCredentialsException(
        'Esta cuenta de Google ya está vinculada a otro usuario.',
      );
    }

    // 6. Si todas las validaciones pasaron, persistir la vinculación de forma atómica
    await this.authRepository.linkGoogleAccount(
      dbUser.id,
      verifiedGoogle.sub,
      verifiedGoogle.email,
      verifiedGoogle.picture,
    );

    return {
      ok: true,
      detail: 'Cuenta vinculada exitosamente.',
    };
  }

  async requestPasswordReset(
    dto: RequestPasswordResetDto,
  ): Promise<{ ok: boolean; message: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user || !user.isActive) {
      this.logger.warn(
        `Solicitud de recuperación de contraseña para correo inexistente o inactivo: ${dto.email}`,
      );
      return {
        ok: true,
        message:
          'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
      };
    }

    const latestOtp = await this.authRepository.findLatestOtp(user.id);
    if (latestOtp) {
      const elapsedSeconds =
        (Date.now() - latestOtp.createdAt.getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        this.logger.warn(
          'Cooldown activo para solicitud de código de: ' + dto.email,
        );
        return {
          ok: true,
          message:
            'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
        };
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await this.authRepository.createPasswordResetOtp(
      user.id,
      codeHash,
      expiresAt,
    );

    const recipientName =
      `${user.firstName} ${user.lastName}`.trim() || 'Usuario';
    await this.mailService.send({
      to: user.email,
      subject: `${code} es tu código de recuperación de contraseña - UMSSY`,
      text: `Hola, ${recipientName}: Tu código de recuperación es ${code}. Vence en ${OTP_EXPIRATION_MINUTES} minutos.`,
      mjml: await loadMailTemplate('password-reset-email'),
      values: {
        recipientName,
        code,
        expirationMinutes: String(OTP_EXPIRATION_MINUTES),
      },
    });

    return {
      ok: true,
      message:
        'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.',
    };
  }

  private async validateResetCode(email: string, code: string) {
    const user = await this.authRepository.findUserByEmail(email);
    if (!user) {
      throw new InvalidResetCodeException();
    }

    const otp = await this.authRepository.findLatestValidOtp(user.id);
    if (!otp) {
      throw new InvalidResetCodeException();
    }

    if (otp.attempts >= MAX_OTP_ATTEMPTS) {
      throw new TooManyAttemptsException();
    }

    if (otp.expiresAt < new Date()) {
      throw new ExpiredResetCodeException();
    }

    const isMatch = await bcrypt.compare(code, otp.codeHash);
    if (!isMatch) {
      await this.authRepository.incrementOtpAttempts(otp.id);
      throw new InvalidResetCodeException();
    }

    return { user, otp };
  }

  async verifyPasswordReset(
    dto: VerifyPasswordResetDto,
  ): Promise<{ ok: boolean; message: string }> {
    await this.validateResetCode(dto.email, dto.code);
    return { ok: true, message: 'Código de verificación validado con éxito.' };
  }

  async resetPassword(
    dto: ResetPasswordDto,
  ): Promise<{ ok: boolean; message: string }> {
    const { user, otp } = await this.validateResetCode(dto.email, dto.code);
    const expectedPasswordHash = await this.passwordHistory.validateNewPassword(
      user.id,
      dto.password,
    );
    const newPasswordHash = await bcrypt.hash(dto.password, 10);
    await this.authRepository.updateUserPasswordAndInvalidateOtp(
      user.id,
      newPasswordHash,
      otp.id,
      expectedPasswordHash,
    );
    await this.refreshTokenService.revokeAllForUser(user.id);

    return { ok: true, message: 'Contraseña actualizada correctamente.' };
  }
}
