import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';

@Injectable()
export class PushDispatcherService implements OnModuleInit {
  private readonly logger = new Logger(PushDispatcherService.name);

  constructor(
    private readonly pushSubscriptionsRepository: PushSubscriptionsRepository,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const subject = this.configService.get<string>('VAPID_SUBJECT');
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY');

    if (!subject || !publicKey || !privateKey) {
      throw new Error(
        'VAPID_SUBJECT, VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY must be configured',
      );
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.logger.log('VAPID details configured');
  }

  async dispatchToUsers(
    userIds: string[],
    title: string,
    body: string,
    actionUrl: string,
    groupKey?: string,
  ): Promise<'sent' | 'partial' | 'failed' | 'skipped'> {
    if (userIds.length === 0) return 'skipped';

    const subscriptions =
      await this.pushSubscriptionsRepository.findManyByUserIds(userIds);
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

      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        successCount++;
      } catch (error: unknown) {
        failedCount++;
        const statusCode = this.getStatusCode(error);
        if (statusCode === 404 || statusCode === 410) {
          await this.pushSubscriptionsRepository.deleteByEndpointAndUserId(
            sub.endpoint,
            sub.userId,
          );
        } else {
          this.logger.error(
            `Error sending push to ${sub.endpoint}`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    }

    if (successCount > 0 && failedCount === 0) return 'sent';
    if (successCount > 0 && failedCount > 0) return 'partial';
    if (successCount === 0 && failedCount > 0) return 'failed';
    return 'skipped';
  }

  private getStatusCode(error: unknown): number | undefined {
    if (
      typeof error === 'object' &&
      error !== null &&
      'statusCode' in error &&
      typeof (error as { statusCode: unknown }).statusCode === 'number'
    ) {
      return (error as { statusCode: number }).statusCode;
    }
    return undefined;
  }

  private isDesktopUserAgent(userAgent: string | null): boolean {
    if (!userAgent) return false;
    const ua = userAgent.toLowerCase();
    const isMobile =
      ua.includes('android') || ua.includes('iphone') || ua.includes('ipad');
    return !isMobile;
  }
}