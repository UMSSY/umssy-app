import { Injectable, Logger } from '@nestjs/common';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { MailService } from '../../mail/services/mail.service.js';
import type { MailTemplateName } from '../../mail/types/mail-template-name.types.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import type { ChannelDispatchResult } from '../types/channel-dispatch-result.type.js';
import type { NotificationMailContent } from '../types/notification-mail-content.type.js';
import type { NotificationMailContext } from '../types/notification-mail-context.type.js';
import type { NotificationRecipientDelivery } from '../types/notification-recipient-delivery.type.js';
import { buildRecipientName } from '../utils/build-recipient-name.js';
import { summarizeChannelStatus } from '../utils/summarize-channel-status.js';

const GENERIC_NOTIFICATION_TEMPLATE: MailTemplateName = 'notification';

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
    renderMail?: (context: NotificationMailContext) => NotificationMailContent,
  ): Promise<ChannelDispatchResult> {
    const deliveries: NotificationRecipientDelivery[] = [];
    const templates = new Map<MailTemplateName, Promise<string>>();
    const loadTemplate = (name: MailTemplateName) => {
      if (!templates.has(name)) templates.set(name, loadMailTemplate(name));
      return templates.get(name)!;
    };

    for (const userId of userIds) {
      try {
        const contact = await this.userLookupRepository.findContactByUserId(userId);
        if (!contact?.email) {
          deliveries.push({ recipientId: userId, channel: 'email', status: 'skipped' });
          continue;
        }

        const content: NotificationMailContent = renderMail
          ? renderMail({
              recipientName: buildRecipientName(contact.firstName, contact.lastName),
              actionUrl,
            })
          : {
              template: GENERIC_NOTIFICATION_TEMPLATE,
              subject: title,
              text: body,
              values: { title, body, actionUrl },
            };

        await this.mailService.send({
          to: contact.email,
          subject: content.subject,
          text: content.text,
          mjml: await loadTemplate(content.template),
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
