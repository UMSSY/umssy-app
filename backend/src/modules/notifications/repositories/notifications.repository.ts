import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { NotificationResponse } from '../types/notification-response.type.js';

@Injectable()
export class NotificationsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService
  ) {}

  async createMany(data: {
    recipientId: string;
    actorId?: string;
    typeId: string;
    title: string;
    body: string;
    link: string;
    groupKey?: string;
  }[]): Promise<number> {
    const result = await this.prisma.notification.createMany({
      data: data.map((item) => ({
        recipientId: item.recipientId,
        actorId: item.actorId,
        typeId: item.typeId,
        title: item.title,
        body: item.body,
        link: item.link,
        groupKey: item.groupKey,
      })),
    });
    return result.count;
  }

  async findManyByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<NotificationResponse[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: { type: true },
    });

    return records.map((r) => ({
      id: r.id,
      title: r.title,
      body: r.body,
      link: r.link,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
      typeCode: r.type.code,
    }));
  }

  async countUnread(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId: userId, readAt: null },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null },
      data: { readAt: new Date() },
    });
  }
    async findTypeByCode(code: string) {
    return this.prisma.notificationType.findUnique({
      where: { code },
    });
  }
}