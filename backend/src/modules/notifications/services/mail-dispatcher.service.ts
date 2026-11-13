import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';

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

    // Layout base institucional UMSSY (ADR-002)
    const mjmlContent = `
      <mj-section background-color="#ffffff" padding="20px">
        <mj-column>
          <mj-text font-size="20px" font-weight="bold" color="#0B1F2E">${title}</mj-text>
          <mj-text font-size="16px" color="#33465A" padding-top="10px">${body}</mj-text>
          <mj-button background-color="#C9A227" color="#ffffff" href="${actionUrl}" padding-top="20px">
            Ver en UMSSY
          </mj-button>
        </mj-column>
      </mj-section>
    `;

    for (const userId of userIds) {
      try {
        const email = await this.userLookupRepository.findEmailByUserId(userId);
        if (!email) continue;

        await this.mailService.send({
          to: email,
          subject: title,
          text: body,
          mjml: mjmlContent,
          values: {},
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