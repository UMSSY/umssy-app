import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';

@Injectable()
export class PushDispatcherService {
  private readonly logger = new Logger(PushDispatcherService.name);

  constructor(
    private readonly pushSubscriptionsRepository: PushSubscriptionsRepository,
  ) {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT || 'mailto:soporte@umssy.com',
      process.env.VAPID_PUBLIC_KEY || '',
      process.env.VAPID_PRIVATE_KEY || '',
    );
  }

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    groupKey?: string,
  ): Promise<'sent' | 'partial' | 'failed' | 'skipped'> {
    if (userIds.length === 0) return 'skipped';

    const subscriptions = await this.pushSubscriptionsRepository.findManyByUserIds(userIds);
    if (subscriptions.length === 0) return 'skipped';

    let successCount = 0;
    let failedCount = 0;

    const payload = JSON.stringify({
      title: title.substring(0, 100),
      body: body.substring(0, 100),
      url: actionUrl,
      tag: groupKey,
    });

    for (const sub of subscriptions) {
      if (this.isDesktopUserAgent(sub.userAgent)) {
        continue;
      }

      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload);
        successCount++;
      } catch (error: any) {
        failedCount++;
        if (error.statusCode === 404 || error.statusCode === 410) {
          await this.pushSubscriptionsRepository.deleteByEndpoint(sub.endpoint);
        } else {
          this.logger.error(`Error enviando push a ${sub.endpoint}`, error);
        }
      }
    }

    if (successCount > 0 && failedCount === 0) return 'sent';
    if (successCount > 0 && failedCount > 0) return 'partial';
    if (successCount === 0 && failedCount > 0) return 'failed';
    return 'skipped';
  }

  private isDesktopUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    const isMobile = ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
    return !isMobile;
  }
}