import { Injectable, Logger } from '@nestjs/common';
import type { MailSender } from './mail-sender.js';

// Implementación de desarrollo: no envía nada. Registra el destinatario y, fuera de producción, el código.
@Injectable()
export class ConsoleMailSender implements MailSender {
  private readonly logger = new Logger(ConsoleMailSender.name);

  async sendActivationCode(to: string, code: string, expiresAt: Date): Promise<void> {
    const detail = process.env.NODE_ENV === 'production' ? '' : ` Código: ${code}.`;
    this.logger.log(`Correo simulado de activación a ${to}, vence ${expiresAt.toISOString()}.${detail}`);
  }

  async sendAccountActivated(to: string, firstName: string): Promise<void> {
    this.logger.log(`Correo simulado de cuenta activada a ${to} (${firstName})`);
  }

  async sendRejection(to: string, reason: string): Promise<void> {
    this.logger.log(`Correo simulado de rechazo a ${to}. Motivo: ${reason}`);
  }
}