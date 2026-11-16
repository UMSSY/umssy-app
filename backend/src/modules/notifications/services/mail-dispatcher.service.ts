import { Injectable, Logger } from '@nestjs/common';
import { MailService } from '../../mail/services/mail.service.js';
import { loadMailTemplate } from '../../mail/helpers/load-mail-template.js';
import { NotificationUserLookupRepository } from '../repositories/notification-user-lookup.repository.js';
import { readFile } from 'node:fs/promises';

export interface MailDispatchOptions {
  mailTemplateName?: string;
  payload?: Record<string, unknown>;
}

export interface MailDispatchResult {
  status: 'sent' | 'partial' | 'failed' | 'skipped';
  delivered: number;
  failed: number;
}

@Injectable()
export class MailDispatcherService {
  private readonly logger = new Logger(MailDispatcherService.name);

  constructor(
    private readonly mailService: MailService,
    private readonly userLookupRepository: NotificationUserLookupRepository,
  ) {}

  async dispatchWithResult(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    options?: MailDispatchOptions,
  ): Promise<MailDispatchResult> {
    if (userIds.length === 0) {
      return { status: 'skipped', delivered: 0, failed: 0 };
    }

    let successCount = 0;
    let failedCount = 0;

    let mjmlContent: string;
    try {
      if (options?.mailTemplateName) {
        mjmlContent = await loadMailTemplate(options.mailTemplateName);
      } else {
        const templatePath = new URL('../../mail/mjml/notification.mjml', import.meta.url);
        mjmlContent = await readFile(templatePath, 'utf8');
      }
    } catch {
      const templatePath = new URL('../../mail/mjml/notification.mjml', import.meta.url);
      mjmlContent = await readFile(templatePath, 'utf8');
    }

    for (const userId of userIds) {
      try {
        let email: string | null = null;
        let recipientName = 'Usuario';

        if (typeof this.userLookupRepository.findUserRecipientById === 'function') {
          const user = await this.userLookupRepository.findUserRecipientById(userId);
          if (user) {
            email = user.email;
            recipientName = `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'Usuario';
          }
        }
        if (!email) {
          email = await this.userLookupRepository.findEmailByUserId(userId);
        }
        if (!email) continue;

        const values: Record<string, string> = {
          recipientName,
          title,
          body,
          actionUrl,
        };
        if (options?.payload) {
          for (const [k, v] of Object.entries(options.payload)) {
            if (v !== undefined && v !== null) {
              values[k] = String(v);
            }
          }
        }

        await this.mailService.send({
          to: email,
          subject: title,
          text: body,
          mjml: mjmlContent,
          values,
        });
        successCount++;
      } catch (error) {
        failedCount++;
        this.logger.error(`Error enviando correo al usuario ${userId}`, error);
      }
    }

    let status: 'sent' | 'partial' | 'failed' | 'skipped' = 'skipped';
    if (successCount > 0 && failedCount === 0) status = 'sent';
    else if (successCount > 0 && failedCount > 0) status = 'partial';
    else if (successCount === 0 && failedCount > 0) status = 'failed';

    return { status, delivered: successCount, failed: failedCount };
  }

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    options?: MailDispatchOptions,
  ): Promise<'sent' | 'partial' | 'failed' | 'skipped'> {
    const result = await this.dispatchWithResult(userIds, title, body, actionUrl, options);
    return result.status;
  }
}