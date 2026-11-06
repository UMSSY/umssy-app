import { Injectable } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { MS_PER_MINUTE } from '../constants/otp.constants.js';
import { buildFrontendUrl } from './helpers/frontend-url.js';
import { RejectionMailLinkService } from '../services/rejection-mail-link.service.js';
import type { MailSender } from './mail-sender.js';
import {
  ACCOUNT_ACTIVATED_MJML,
  ACTIVATION_CODE_MJML,
  loadRejectionTemplate,
} from './templates/access-request-mails.template.js';

// Envía los correos de solicitudes de acceso con el MailService del proyecto (SMTP o consola, según MAIL_TRANSPORT)
@Injectable()
export class MailServiceSender implements MailSender {
  constructor(
    private readonly mailService: MailService,
    private readonly rejectionLinks: RejectionMailLinkService,
  ) {}

  async sendActivationCode(to: string, code: string, expiresAt: Date): Promise<void> {
    const minutes = Math.max(1, Math.round((expiresAt.getTime() - Date.now()) / MS_PER_MINUTE));
    const activationUrl = buildFrontendUrl('/request-access/activation', { email: to });
    await this.mailService.send({
      to,
      subject: 'Tu código de activación de UMSSY',
      text: `Tu solicitud de acceso fue aprobada. Tu código de activación es ${code} y vence en ${minutes} minutos. Actívalo en ${activationUrl}`,
      mjml: ACTIVATION_CODE_MJML,
      values: { code, expiresInMinutes: String(minutes), activationUrl },
    });
  }

  async sendAccountActivated(to: string, firstName: string): Promise<void> {
    const loginUrl = buildFrontendUrl('/login');
    await this.mailService.send({
      to,
      subject: 'Tu cuenta de UMSSY está activa',
      text: `Hola ${firstName}, tu cuenta fue activada. Inicia sesión en ${loginUrl}`,
      mjml: ACCOUNT_ACTIVATED_MJML,
      values: { firstName, loginUrl },
    });
  }

  async sendRejection(to: string, reason: string): Promise<void> {
    const link = await this.rejectionLinks.forRecipient(to, reason);
    await this.mailService.send({
      to,
      subject: 'Tu solicitud de acceso a UMSSY necesita otro documento',
      text: `Necesitamos otro documento. Código de solicitud: ${link.requestCode}.\n\nMotivo del rechazo:\n${reason}\n\nAbre Mi solicitud e ingresa el correo que registraste: ${link.url}\n\nEste enlace es personal. No lo compartas.`,
      mjml: await loadRejectionTemplate(),
      values: { reason, requestCode: link.requestCode, requestStatusUrl: link.url },
    });
  }
}
