import { Injectable, Logger } from '@nestjs/common';
import nodemailer from 'nodemailer';
import { renderPasswordResetEmail } from './templates/password-reset.template.js';

@Injectable()
export class PasswordResetMailerService {
  private readonly logger = new Logger(PasswordResetMailerService.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    const port = Number(process.env.SMTP_PORT) || 465;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: { user, pass },
      });
    } else {
      this.logger.warn('Credenciales SMTP incompletas; el servicio funcionará en modo log.');
    }
  }

  async sendPasswordResetCode(to: string, code: string, recipientName?: string): Promise<void> {
    const html = renderPasswordResetEmail({ code, recipientName, expirationMinutes: 10 });

    if (this.transporter) {
      try {
        await this.transporter.sendMail({
          from: process.env.MAIL_FROM || `UMSSY <${process.env.SMTP_USER}>`,
          to,
          subject: `${code} es tu código de recuperación de contraseña - UMSSY`,
          html,
        });
        this.logger.log(`Código de recuperación enviado exitosamente a ${to}`);
      } catch (err) {
        this.logger.error(`Error al enviar correo SMTP a ${to}:`, err);
        throw err;
      }
    } else {
      this.logger.log(`[SIMULACIÓN] Código de recuperación para ${to}: ${code}`);
    }
  }
}
