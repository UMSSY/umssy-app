import { MINUTE_MS } from '../../../common/constants/date-time.constants.js';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../../auth/services/auth.service.js';

import { OTP_MAX_ATTEMPTS, OTP_TTL_MINUTES } from '../constants/otp.constants.js';
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
import { MAIL_SENDER, type MailSender } from '../mail/mail-sender.js';
import { AccountActivationRepository } from '../repositories/account-activation.repository.js';
import { ActivationOtpRepository } from '../repositories/activation-otp.repository.js';
import { ActivationOtpService } from './activation-otp.service.js';

type ApprovedRequest = NonNullable<Awaited<ReturnType<AccountActivationRepository['findApprovedRequestByEmail']>>>;
type OtpRow = NonNullable<Awaited<ReturnType<ActivationOtpRepository['findLatestByRequest']>>>;

interface ActivationContext {
  request: ApprovedRequest;
  otp: OtpRow | null;
  activated: boolean;
}

export type ActivationState = 'ready' | 'expired' | 'locked' | 'no_code' | 'activated';

@Injectable()
export class AccountActivationService {
  private readonly logger = new Logger(AccountActivationService.name);

  constructor(
    private readonly activationRepository: AccountActivationRepository,
    private readonly otpRepository: ActivationOtpRepository,
    private readonly otpService: ActivationOtpService,
    private readonly authService: AuthService,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
  ) {}

  async getStatus(email: string, now: Date = new Date()) {
    const { request, otp, activated } = await this.loadContext(email);
    if (activated) {
      return { state: 'activated' as ActivationState, serverTime: now.toISOString(), expiresAt: null, resendAvailableAt: null, resendsRemaining: 0, remainingAttempts: 0 };
    }
    const resends = await this.otpRepository.countResendsSince(request.id, new Date(now.getTime() - 3_600_000));
    return {
      state: this.resolveState(otp, now),
      serverTime: now.toISOString(),
      expiresAt: otp ? otp.expiresAt.toISOString() : null,
      resendAvailableAt: (otp ? new Date(otp.createdAt.getTime() + 60 * 1_000) : now).toISOString(),
      resendsRemaining: Math.max(0, 3 - resends),
      remainingAttempts: otp ? Math.max(0, OTP_MAX_ATTEMPTS - otp.attempts) : 0,
    };
  }

  async verify(email: string, code: string, now: Date = new Date()) {
    const context = await this.loadContext(email);
    const otp = await this.checkCode(context, code, now);
    return { valid: true, expiresAt: otp.expiresAt.toISOString() };
  }

  async activate(email: string, code: string, password: string, now: Date = new Date()) {
    const context = await this.loadContext(email);
    const otp = await this.checkCode(context, code, now);
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await this.activationRepository.createUserAndConsumeOtp(
      otp.id,
      {
        firstName: context.request.firstName,
        lastName: context.request.lastName,
        email: context.request.email,
        phone: context.request.phone,
        passwordHash,
        accessRequestId: context.request.id,
      },
      now,
    );
    if (result === 'already_used') throw new AccountAlreadyActivatedException();

    await this.notifyActivated(context.request);
    return this.authService.login({ email: context.request.email, password });
  }

  async resend(email: string, now: Date = new Date()) {
    const { request, otp, activated } = await this.loadContext(email);
    if (activated) throw new AccountAlreadyActivatedException();

    const resends = await this.otpRepository.countResendsSince(request.id, new Date(now.getTime() - 3_600_000));
    if (resends >= 3) throw new ResendLimitExceededException();

    if (otp) {
      const waitMs = 60 * 1_000 - (now.getTime() - otp.createdAt.getTime());
      if (waitMs > 0) throw new ResendTooSoonException(Math.ceil(waitMs / 1_000));
    }

    const sent = await this.otpService.issueFor(request.id, request.email, now);
    if (!sent) throw new ActivationCodeNotSentException();

    return {
      serverTime: now.toISOString(),
      expiresAt: new Date(now.getTime() + OTP_TTL_MINUTES * MINUTE_MS).toISOString(),
      resendAvailableAt: new Date(now.getTime() + 60 * 1_000).toISOString(),
      resendsRemaining: Math.max(0, 3 - resends - 1),
    };
  }

  private async loadContext(email: string): Promise<ActivationContext> {
    const request = await this.activationRepository.findApprovedRequestByEmail(email);
    if (!request) throw new ActivationRequestNotFoundException();
    const otp = await this.otpRepository.findLatestByRequest(request.id);
    const activated = Boolean(otp?.usedAt) || (await this.activationRepository.userExistsByEmail(request.email));
    return { request, otp, activated };
  }

  private resolveState(otp: OtpRow | null, now: Date): ActivationState {
    if (!otp) return 'no_code';
    if (otp.attempts >= OTP_MAX_ATTEMPTS) return 'locked';
    if (otp.expiresAt.getTime() <= now.getTime()) return 'expired';
    return 'ready';
  }

  private async checkCode(context: ActivationContext, code: string, now: Date): Promise<OtpRow> {
    if (context.activated) throw new AccountAlreadyActivatedException();
    const state = this.resolveState(context.otp, now);
    if (state === 'locked') throw new ActivationAttemptsExceededException();
    if (state !== 'ready' || !context.otp) throw new ActivationCodeExpiredException();

    const { otp } = context;
    // El intento se reserva antes de comparar: así las peticiones simultáneas no pueden probar más de OTP_MAX_ATTEMPTS códigos
    const reserved = await this.otpRepository.reserveAttempt(otp.id, now);
    if (!reserved) throw new ActivationAttemptsExceededException();

    if (await bcrypt.compare(code, otp.codeHash)) {
      await this.otpRepository.releaseAttempt(otp.id);
      return otp;
    }

    const remaining = OTP_MAX_ATTEMPTS - reserved.attempts;
    if (remaining <= 0) {
      await this.otpRepository.invalidate(otp.id, now);
      throw new ActivationAttemptsExceededException();
    }
    throw new InvalidActivationCodeException(remaining);
  }

  private async notifyActivated(request: ApprovedRequest): Promise<void> {
    try {
      await this.mailSender.sendAccountActivated(request.email, request.firstName);
    } catch (error) {
      this.logger.error(
        `No se pudo enviar el correo de cuenta activada de la solicitud ${request.id}`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
