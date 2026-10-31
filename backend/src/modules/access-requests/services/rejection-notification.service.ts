import { Inject, Injectable, Logger } from '@nestjs/common';
import { MAIL_SENDER, type MailSender } from '../mail/mail-sender.js';
import { RejectionMailContextService } from '../mail/rejection-mail-context.service.js';

@Injectable()
export class RejectionNotificationService {
  private readonly logger = new Logger(RejectionNotificationService.name);

  constructor(
    @Inject(MAIL_SENDER) private readonly mailSender: MailSender,
    private readonly context: RejectionMailContextService,
  ) {}

  async notify(email: string, reason: string, accessRequestId: string): Promise<boolean> {
    try {
      await this.context.run(accessRequestId, async () => {
        await this.mailSender.sendRejection(email, reason);
      });
      return true;
    } catch {
      // Los errores del transporte pueden incluir el destinatario o el enlace.
      this.logger.error(`No se pudo enviar el correo de rechazo de la solicitud ${accessRequestId}`);
      return false;
    }
  }
}
