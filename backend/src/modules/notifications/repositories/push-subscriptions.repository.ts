import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { PushSubscriptionPayload } from '../types/push-subscription-payload.type.js';

export interface PushSubscriptionRecord {
  id: string;
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string | null;
}

@Injectable()
export class PushSubscriptionsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async upsert(userId: string, payload: PushSubscriptionPayload): Promise<void> {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: payload.endpoint },
      update: {
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        userAgent: payload.userAgent,
        lastUsedAt: new Date(),
      },
      create: {
        userId,
        endpoint: payload.endpoint,
        p256dh: payload.keys.p256dh,
        auth: payload.keys.auth,
        userAgent: payload.userAgent,
      },
    });
  }

  async deleteByEndpointAndUserId(
    endpoint: string,
    userId: string,
  ): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint, userId },
    });
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
  }

  async findManyByUserIds(userIds: string[]): Promise<PushSubscriptionRecord[]> {
    return this.prisma.pushSubscription.findMany({
      where: { userId: { in: userIds } },
      select: {
        id: true,
        userId: true,
        endpoint: true,
        p256dh: true,
        auth: true,
        userAgent: true,
      },
    });
  }
}