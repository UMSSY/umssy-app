import { Inject, Injectable, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomInt } from 'node:crypto';
import { MS_PER_MINUTE, OTP_BCRYPT_ROUNDS, OTP_DIGITS, OTP_TTL_MINUTES } from '../constants/otp.constants.js';
import { MAIL_SENDER, type MailSender } from '../mail/mail-sender.js';
import { ActivationOtpRepository } from '../repositories/activation-otp.repository.js';

export function generateOtpCode(): string {
  return String(randomInt(0, 10 ** OTP_DIGITS)).padStart(OTP_DIGITS, '0');
}

@Injectable()
export class ActivationOtpService {
  private readonly logger = new Logger(ActivationOtpService.name);

  constructor(
    private readonly otpRepository: ActivationOtpRepository,
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
  ) {}

  async issueFor(accessRequestId: string, email: string, now: Date = new Date()): Promise<boolean> {
    let createdId: string | null = null;
    try {
      const code = generateOtpCode();
      const expiresAt = new Date(now.getTime() + OTP_TTL_MINUTES * MS_PER_MINUTE);
      const codeHash = await bcrypt.hash(code, OTP_BCRYPT_ROUNDS);
      const created = await this.otpRepository.create({ accessRequestId, codeHash, expiresAt });
      createdId = created.id;
      await this.mailSender.sendActivationCode(email, code, expiresAt);
      await this.invalidatePrevious(accessRequestId, created.id, now);
      return true;
    } catch (error) {
      if (createdId) await this.discard(createdId);
      this.logger.error(
        `No se pudo generar o enviar el código de activación de la solicitud ${accessRequestId}`,
        error instanceof Error ? error.stack : String(error),
      );
      return false;
    }
  }

  // El código nuevo ya salió por correo: fallar aquí no debe invalidarlo
  private async invalidatePrevious(accessRequestId: string, keepId: string, now: Date): Promise<void> {
    try {
      await this.otpRepository.invalidateOthers(accessRequestId, keepId, now);
    } catch (error) {
      this.logger.warn(
        `No se pudieron invalidar los códigos anteriores de la solicitud ${accessRequestId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private async discard(id: string): Promise<void> {
    try {
      await this.otpRepository.remove(id);
    } catch {
      this.logger.warn(`No se pudo descartar el código ${id}`);
    }
  }
}