import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { readFile } from 'node:fs/promises';

@Injectable()
export class MailDispatcherService {
  private readonly logger = new Logger(MailDispatcherService.name);

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

    let successCount = 0;
    let failedCount = 0;

    const templatePath = new URL('../../mail/mjml/notification.mjml', import.meta.url);
const mjmlContent = await readFile(templatePath, 'utf8');

    for (const userId of userIds) {
      try {
        const email = await this.userLookupRepository.findEmailByUserId(userId);
        if (!email) continue;

        await this.mailService.send({
          to: email,
          subject: title,
          text: body,
          mjml: mjmlContent,
          values: {
            title: title,
            body: body,
            actionUrl: actionUrl,
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
}