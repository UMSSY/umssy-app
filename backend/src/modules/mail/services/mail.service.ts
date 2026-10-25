import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';
import { parseMailConfig } from '../../../config/mail.config.js';
import { MailTemplateService } from './mail-template.service.js';
import type { SendMailPayload } from '../types/send-mail-payload.types.js';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly config = parseMailConfig();
  private readonly transporter?: Transporter;

  constructor(private readonly templates: MailTemplateService) {
    if (this.config.MAIL_TRANSPORT === 'smtp') {
      this.transporter = nodemailer.createTransport({
        host: this.config.SMTP_HOST,
        port: this.config.SMTP_PORT,
        secure: this.config.SMTP_SECURE,
        requireTLS: this.config.SMTP_REQUIRE_TLS,
        auth: this.config.SMTP_USER
          ? { user: this.config.SMTP_USER, pass: this.config.SMTP_PASSWORD }
          : undefined,
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 30000,
        disableFileAccess: true,
        disableUrlAccess: true,
      });
    }
  }

  async send(message: SendMailPayload): Promise<void> {
    const { to, subject, text } = message;
    const html = await this.templates.render(message.mjml, {
      ...message.values,
      brandName: this.config.MAIL_FROM_NAME,
      logoUrl: this.config.MAIL_LOGO_URL,
    });
    if (!this.transporter) {
      this.logger.log(`[Correo local] Para: ${to}. ${subject}. ${text}`);
      return;
    }
    const result = await this.transporter.sendMail({
      from: {
        name: this.config.MAIL_FROM_NAME,
        address: this.config.MAIL_FROM_ADDRESS,
      },
      replyTo: this.config.MAIL_REPLY_TO || undefined,
      to,
      subject,
      text,
      html,
    });
    if (result.rejected?.length || !result.accepted?.length) {
      throw new Error('SMTP did not accept the email recipient.');
    }
  }
}
