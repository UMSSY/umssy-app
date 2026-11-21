import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { CreatedNotification } from '../types/created-notification.type.js';
import type { NotificationResponse } from '../types/notification-response.type.js';
import type { NotificationReadState } from '../types/notification-read-state.type.js';

const INBOX_TYPE_FILTER = {
  code: { notIn: ['CHAT_MESSAGE', 'CHAT_GROUP_MESSAGE'] },
};

@Injectable()
export class NotificationsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  async createMany(
    data: {
      recipientId: string;
      actorId?: string;
      typeId: string;
      title: string;
      body: string;
      link: string;
      groupKey?: string;
    }[],
  ): Promise<CreatedNotification[]> {
    if (!data.some((item) => item.groupKey?.startsWith('radar:'))) {
      return this.prisma.notification.createManyAndReturn({
        data,
        select: { id: true, recipientId: true },
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const created: CreatedNotification[] = [];
      for (const item of data) {
        if (item.groupKey?.startsWith('radar:')) {
          await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${item.recipientId + ':' + item.groupKey}, 0))`;
          const existing = await tx.notification.findFirst({
            where: {
              recipientId: item.recipientId,
              typeId: item.typeId,
              groupKey: item.groupKey,
            },
            select: { id: true },
          });
          if (existing) continue;
        }
        created.push(
          await tx.notification.create({
            data: item,
            select: { id: true, recipientId: true },
          }),
        );
      }
      return created;
    });
  }

  findByType(userId: string, typeCode: string) {
    return this.prisma.notification.findMany({
      where: { recipientId: userId, type: { code: typeCode } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: { id: true, groupKey: true, createdAt: true, readAt: true },
    });
  }

  async findManyByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<NotificationResponse[]> {
    const records = await this.prisma.notification.findMany({
      where: { recipientId: userId, type: INBOX_TYPE_FILTER },
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
      where: { recipientId: userId, readAt: null, type: INBOX_TYPE_FILTER },
    });
  }

  async findReadStateById(
    id: string,
    userId: string,
  ): Promise<NotificationReadState | null> {
    return this.prisma.notification.findFirst({
      where: { id, recipientId: userId },
      select: { readAt: true },
    });
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { id, recipientId: userId, readAt: null, type: INBOX_TYPE_FILTER },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, readAt: null, type: INBOX_TYPE_FILTER },
      data: { readAt: new Date() },
    });
  }
  async findTypeByCode(code: string) {
    return this.prisma.notificationType.findUnique({
      where: { code },
    });
  }
}
