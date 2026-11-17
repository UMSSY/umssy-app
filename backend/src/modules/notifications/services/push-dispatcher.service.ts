import { Injectable, Logger } from '@nestjs/common';
import * as webpush from 'web-push';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import type { ChannelDispatchResult } from '../types/channel-dispatch-result.type.js';
import { summarizeChannelStatus } from '../utils/summarize-channel-status.js';

@Injectable()
export class PushDispatcherService {
  private readonly logger = new Logger(PushDispatcherService.name);

  constructor(
    private readonly pushSubscriptionsRepository: PushSubscriptionsRepository,
  ) {
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:soporte@umssy.com',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
      } catch (error) {
        this.logger.warn(
          'No se pudieron configurar los detalles de VAPID',
          error instanceof Error ? error.message : String(error),
        );
      }
    } else {
      this.logger.warn(
        'Claves VAPID no configuradas; notificaciones push desactivadas.',
      );
    }
  }

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    groupKey?: string,
  ): Promise<ChannelDispatchResult> {
    if (userIds.length === 0) return { status: 'skipped', deliveries: [] };

    const subscriptions = await this.pushSubscriptionsRepository.findManyByUserIds(userIds);

    let successCount = 0;
    let failedCount = 0;
    const sentUserIds = new Set<string>();
    const failedUserIds = new Set<string>();

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
        sentUserIds.add(sub.userId);
      } catch (error: any) {
        failedCount++;
        failedUserIds.add(sub.userId);
        if (error.statusCode === 404 || error.statusCode === 410) {
          await this.pushSubscriptionsRepository.deleteByEndpointAndUserId(sub.endpoint, sub.userId);
        } else {
          this.logger.error(`Error enviando push a ${sub.endpoint}`, error);
        }
      }
    }

    return {
      status: summarizeChannelStatus(successCount, failedCount),
      deliveries: userIds.map((recipientId) => ({
        recipientId,
        channel: 'push',
        status: sentUserIds.has(recipientId)
          ? 'sent'
          : failedUserIds.has(recipientId)
            ? 'failed'
            : 'skipped',
      })),
    };
  }

  private isDesktopUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    const isMobile = ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
    return !isMobile;
  }
}