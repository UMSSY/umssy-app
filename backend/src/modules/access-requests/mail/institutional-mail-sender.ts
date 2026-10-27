import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import type { MailSender } from './mail-sender.js';

const template =
  '<mj-section><mj-column><mj-text>{{message}}</mj-text></mj-column></mj-section>';

@Injectable()
export class InstitutionalMailSender implements MailSender {
  constructor(private readonly mail: MailService) {}
  sendActivationCode(
    to: string,
    code: string,
    expiresAt: Date,
    requestId?: string,
  ) {
    const origin = (process.env.CORS_ORIGIN ?? '').split(',')[0]?.trim();
    const path = requestId
      ? `/activate-account?requestId=${encodeURIComponent(requestId)}`
      : '/activate-account';
    const message = `Tu código de activación UMSSY es ${code}. Vence el ${expiresAt.toISOString()}. Activa tu cuenta en ${origin ? new URL(path, origin).href : path}. Si ya tienes una cuenta, utiliza su contraseña actual para vincular la aprobación.`;
    return this.mail.send({
      to,
      subject: 'Activa tu cuenta aprobada en UMSSY',
      text: message,
      mjml: template,
      values: { message },
    });
  }
  sendRejection(to: string, reason: string) {
    return this.mail.send({
      to,
      subject: 'Resultado de tu solicitud de acceso a UMSSY',
      text: reason,
      mjml: template,
      values: { message: reason },
    });
  }
}
