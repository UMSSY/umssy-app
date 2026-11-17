import { Injectable, Logger } from '@nestjs/common';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import type { ChannelDispatchResult } from '../types/channel-dispatch-result.type.js';
import type { NotificationMailContent } from '../types/notification-mail-content.type.js';
import type { NotificationMailRenderer } from '../types/notification-mail-renderer.type.js';
import type { NotificationRecipientDelivery } from '../types/notification-recipient-delivery.type.js';
import { buildRecipientName } from '../utils/build-recipient-name.js';
import { summarizeChannelStatus } from '../utils/summarize-channel-status.js';

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
    renderMail?: NotificationMailRenderer,
  ): Promise<ChannelDispatchResult> {
    const deliveries: NotificationRecipientDelivery[] = [];
    let genericTemplate: Promise<string> | undefined;
    const loadGenericTemplate = () =>
      (genericTemplate ??= loadMailTemplate('notification'));

    for (const userId of userIds) {
      try {
        const contact = await this.userLookupRepository.findContactByUserId(userId);
        if (!contact?.email) {
          deliveries.push({ recipientId: userId, channel: 'email', status: 'skipped' });
          continue;
        }

        const content: NotificationMailContent = renderMail
          ? await renderMail({
              recipientName: buildRecipientName(contact.firstName, contact.lastName),
              actionUrl,
            })
          : {
              mjml: await loadGenericTemplate(),
              subject: title,
              text: body,
              values: { title, body, actionUrl },
            };

        await this.mailService.send({
          to: contact.email,
          subject: content.subject,
          text: content.text,
          mjml: content.mjml,
          values: content.values,
        });
        deliveries.push({ recipientId: userId, channel: 'email', status: 'sent' });
      } catch (error) {
        deliveries.push({ recipientId: userId, channel: 'email', status: 'failed' });
        this.logger.error(`Error enviando correo al usuario ${userId}`, error);
      }
    }

    return {
      status: summarizeChannelStatus(
        deliveries.filter((delivery) => delivery.status === 'sent').length,
        deliveries.filter((delivery) => delivery.status === 'failed').length,
      ),
      deliveries,
    };
  }
}
