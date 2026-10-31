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
} from '../exceptions/index.js';
import { LOGIN_ROLE_PRIORITY } from '../constants/login-role-priority.constants.js';
import { MailService } from '../../mail/services/mail.service.js';
import { PASSWORD_RESET_EMAIL_MJML } from '../templates/password-reset-email.template.js';
import type { SessionResponse } from '../types/session-response.types.js';
import type { LoginResponse } from '../types/login-response.types.js';
import type { AuthenticatedUser } from '../../../common/types/authenticated-user.types.js';
import type { LoginDto } from '../requests/login.schema.js';
import type { RequestPasswordResetDto } from '../requests/request-password-reset.schema.js';
import type { VerifyPasswordResetDto } from '../requests/verify-password-reset.schema.js';
import type { ResetPasswordDto } from '../requests/reset-password.schema.js';

const OTP_EXPIRATION_MINUTES = 5;
const RESEND_COOLDOWN_SECONDS = 120;
const MAX_OTP_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  existsByEmail(email: string) {
    return this.authRepository.existsByEmail(email);
  }

  getSession(user: AuthenticatedUser): SessionResponse {
    return { id: user.id, email: user.email, roles: user.roles };
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
      throw new RoleNotAssignedException(dto.roleTag ? undefined : "El usuario no tiene roles habilitados");
    }

    const accessToken = this.jwtService.sign({ sub: user.id, roleTag, roles });
    return { accessToken, roleTag, roles };
  }

  async requestPasswordReset(dto: RequestPasswordResetDto): Promise<{ ok: boolean; message: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    if (!user || !user.isActive) {
      this.logger.warn(`Solicitud de recuperación de contraseña para correo inexistente o inactivo: ${dto.email}`);
      return { ok: true, message: 'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.' };
    }

    const latestOtp = await this.authRepository.findLatestOtp(user.id);
    if (latestOtp) {
      const elapsedSeconds = (Date.now() - latestOtp.createdAt.getTime()) / 1000;
      if (elapsedSeconds < RESEND_COOLDOWN_SECONDS) {
        this.logger.warn('Cooldown activo para solicitud de código de: ' + dto.email);
        return { ok: true, message: 'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.' };
      }
    }

    const code = crypto.randomInt(100000, 1000000).toString();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MINUTES * 60 * 1000);

    await this.authRepository.createPasswordResetOtp(user.id, codeHash, expiresAt);

    const recipientName = `${user.firstName} ${user.lastName}`.trim() || 'Usuario';
    await this.mailService.send({
      to: user.email,
      subject: `${code} es tu código de recuperación de contraseña - UMSSY`,
      text: `Hola, ${recipientName}: Tu código de recuperación es ${code}. Vence en ${OTP_EXPIRATION_MINUTES} minutos.`,
      mjml: PASSWORD_RESET_EMAIL_MJML,
      values: {
        recipientName,
        code,
        expirationMinutes: String(OTP_EXPIRATION_MINUTES),
      },
    });

    return { ok: true, message: 'Si el correo está registrado, recibirás un código de verificación. Si ya solicitaste uno, espera 2 minutos.' };
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

  async verifyPasswordReset(dto: VerifyPasswordResetDto): Promise<{ ok: boolean; message: string }> {
    await this.validateResetCode(dto.email, dto.code);
    return { ok: true, message: 'Código de verificación validado con éxito.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: boolean; message: string }> {
    const { user, otp } = await this.validateResetCode(dto.email, dto.code);
    const newPasswordHash = await bcrypt.hash(dto.password, 10);
    await this.authRepository.updateUserPasswordAndInvalidateOtp(user.id, newPasswordHash, otp.id);

    return { ok: true, message: 'Contraseña actualizada correctamente.' };
  }
}
