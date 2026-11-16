import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { parseMailConfig } from '../../../config/mail.config.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { truncateNotificationText } from '../utils/truncate-notification-text.js';

@Injectable()
export class MailDispatcherService {
  private readonly logger = new Logger(MailDispatcherService.name);
  private readonly appUrl = parseMailConfig().MAIL_APP_URL;

  constructor(
    private readonly mailService: MailService,
    private readonly userLookupRepository: NotificationUserLookupRepository,
  ) {}

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
  ): Promise<'sent' | 'partial' | 'failed' | 'skipped'> {
    if (userIds.length === 0) return 'skipped';

    const safeTitle = truncateNotificationText(title);
    const safeBody = truncateNotificationText(body);
    const absoluteActionUrl = this.toAbsoluteActionUrl(actionUrl);
    const mjml = await loadMailTemplate('notification');

    let successCount = 0;
    let failedCount = 0;

    for (const userId of userIds) {
      try {
        const email = await this.userLookupRepository.findEmailByUserId(userId);
        if (!email) continue;

        await this.mailService.send({
          to: email,
          subject: safeTitle,
          text: `${safeBody}\n\nVer en UMSSY: ${absoluteActionUrl}`,
          mjml,
          values: {
            title: safeTitle,
            body: safeBody,
            actionUrl: absoluteActionUrl,
          },
        });
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(`Error enviando correo al usuario ${userId}`, error);
      }
    }

    if (successCount > 0 && failedCount === 0) return 'sent';
    if (successCount > 0 && failedCount > 0) return 'partial';
    if (successCount === 0 && failedCount > 0) return 'failed';
    return 'skipped';
  }

  /**
   * Los actionUrl del catálogo son rutas relativas del frontend. En un correo
   * se necesita la URL completa; además, cualquier URL de otro origen se
   * descarta para no convertir el botón en un redirect abierto.
   */
  private toAbsoluteActionUrl(actionUrl: string): string {
    const base = new URL(this.appUrl);
    try {
      const resolved = new URL(actionUrl || '/', base);
      return resolved.origin === base.origin ? resolved.toString() : base.toString();
    } catch {
      return base.toString();
    }
  }
}
