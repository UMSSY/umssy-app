import { createRequire } from 'node:module';
import { Injectable, Logger } from '@nestjs/common';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';

interface WebPushSubscription {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface WebPushClient {
  setVapidDetails(subject: string, publicKey: string, privateKey: string): void;
  sendNotification(subscription: WebPushSubscription, payload: string): Promise<unknown>;
}

const require = createRequire(import.meta.url);

function loadWebPush(): WebPushClient | null {
  try {
    return require('web-push') as WebPushClient;
  } catch {
    return null;
  }
}

@Injectable()
export class PushDispatcherService {
  private readonly logger = new Logger(PushDispatcherService.name);
  private readonly webpush: WebPushClient | null;

  constructor(
    private readonly pushSubscriptionsRepository: PushSubscriptionsRepository,
  ) {
    this.webpush = loadWebPush();
    if (this.webpush) {
      this.webpush.setVapidDetails(
        process.env.VAPID_SUBJECT || 'mailto:soporte@umssy.com',
        process.env.VAPID_PUBLIC_KEY || '',
        process.env.VAPID_PRIVATE_KEY || '',
      );
    }
  }

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    groupKey?: string,
  ): Promise<'sent' | 'partial' | 'failed' | 'skipped'> {
    if (!this.webpush || userIds.length === 0) return 'skipped';

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

      const pushSubscription: WebPushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      };

      try {
        await this.webpush.sendNotification(pushSubscription, payload);
        successCount++;
      } catch (error: unknown) {
        failedCount++;
        const statusCode =
          typeof error === 'object' && error !== null && 'statusCode' in error
            ? (error as { statusCode?: number }).statusCode
            : undefined;

        if (statusCode === 404 || statusCode === 410) {
          await this.pushSubscriptionsRepository.deleteByEndpointAndUserId(sub.endpoint, sub.userId);
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
