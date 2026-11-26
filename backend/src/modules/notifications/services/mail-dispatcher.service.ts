import { Injectable, Logger } from '@nestjs/common';
import { frontendBaseUrl } from '../../mail/helpers/frontend-url.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { MailService } from '../../mail/services/mail.service.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import type { ChannelDispatchResult } from '../types/channel-dispatch-result.type.js';
import type { NotificationMailContent } from '../types/notification-mail-content.type.js';
import type { NotificationMailRenderer } from '../types/notification-mail-renderer.type.js';
import type { NotificationRecipientDelivery } from '../types/notification-recipient-delivery.type.js';
import { buildRecipientName } from '../utils/build-recipient-name.js';
import { isDeliverableEmail } from '../utils/is-deliverable-email.js';
import { summarizeChannelStatus } from '../utils/summarize-channel-status.js';
import { truncateNotificationText } from '../utils/truncate-notification-text.js';

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
    const genericTitle = truncateNotificationText(title);
    const genericBody = truncateNotificationText(body);
    const absoluteActionUrl = this.toAbsoluteActionUrl(actionUrl);
    let reservedDomainSkips = 0;

    for (const userId of userIds) {
      try {
        const contact =
          await this.userLookupRepository.findContactByUserId(userId);
        if (!contact?.email) {
          deliveries.push({
            recipientId: userId,
            channel: 'email',
            status: 'skipped',
          });
          continue;
        }
        if (!isDeliverableEmail(contact.email)) {
          reservedDomainSkips += 1;
          deliveries.push({
            recipientId: userId,
            channel: 'email',
            status: 'skipped',
          });
          continue;
        }

        const content = await this.resolveContent(
          buildRecipientName(contact.firstName, contact.lastName),
          actionUrl,
          genericTitle,
          genericBody,
          absoluteActionUrl,
          loadGenericTemplate,
          renderMail,
        );

        await this.mailService.send({
          to: contact.email,
          subject: content.subject,
          text: content.text,
          mjml: content.mjml,
          values: content.values,
        });
        deliveries.push({
          recipientId: userId,
          channel: 'email',
          status: 'sent',
        });
      } catch (error) {
        deliveries.push({
          recipientId: userId,
          channel: 'email',
          status: 'failed',
        });
        this.logger.error(`Error enviando correo al usuario ${userId}`, error);
      }
    }

    if (reservedDomainSkips > 0) {
      this.logger.log(
        `Correos omitidos por dominio de prueba: ${reservedDomainSkips} de ${userIds.length}`,
      );
    }

    return {
      status: summarizeChannelStatus(
        deliveries.filter((delivery) => delivery.status === 'sent').length,
        deliveries.filter((delivery) => delivery.status === 'failed').length,
      ),
      deliveries,
    };
  }

  async dispatchToEmails(
    emails: string[],
    title: string,
    body: string,
    actionUrl: string,
    renderMail?: NotificationMailRenderer,
  ): Promise<ChannelDispatchResult> {
    const deliveries: NotificationRecipientDelivery[] = [];
    let genericTemplate: Promise<string> | undefined;
    const loadGenericTemplate = () =>
      (genericTemplate ??= loadMailTemplate('notification'));
    const genericTitle = truncateNotificationText(title);
    const genericBody = truncateNotificationText(body);
    const absoluteActionUrl = this.toAbsoluteActionUrl(actionUrl);

    for (const email of emails) {
      try {
        const content = await this.resolveContent(
          email,
          actionUrl,
          genericTitle,
          genericBody,
          absoluteActionUrl,
          loadGenericTemplate,
          renderMail,
        );
        await this.mailService.send({
          to: email,
          subject: content.subject,
          text: content.text,
          mjml: content.mjml,
          values: content.values,
        });
        deliveries.push({ recipientId: email, channel: 'email', status: 'sent' });
      } catch (error) {
        deliveries.push({ recipientId: email, channel: 'email', status: 'failed' });
        this.logger.error(`Error enviando correo al destinatario ${email}`, error);
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

  private async resolveContent(
    recipientName: string,
    actionUrl: string,
    genericTitle: string,
    genericBody: string,
    absoluteActionUrl: string,
    loadGenericTemplate: () => Promise<string>,
    renderMail?: NotificationMailRenderer,
  ): Promise<NotificationMailContent> {
    if (renderMail) {
      return renderMail({ recipientName, actionUrl });
    }
    return {
      mjml: await loadGenericTemplate(),
      subject: genericTitle,
      text: `${genericBody}\n\nVer en UMSSY: ${absoluteActionUrl}`,
      values: { title: genericTitle, body: genericBody, actionUrl: absoluteActionUrl },
    };
  }

  private toAbsoluteActionUrl(actionUrl: string): string {
    const base = new URL(`${frontendBaseUrl()}/`);
    try {
      const resolved = new URL(actionUrl || '/', base);
      return resolved.origin === base.origin
        ? resolved.toString()
        : base.toString();
    } catch {
      return base.toString();
    }
  }
}