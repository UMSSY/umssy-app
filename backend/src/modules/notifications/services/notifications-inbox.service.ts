import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';

@Injectable()
export class NotificationsInboxService {
  constructor(
    private readonly notificationsRepository: NotificationsRepository,
  ) {}

  async getNotifications(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    const data = await this.notificationsRepository.findManyByUser(
      userId,
      skip,
      limit,
    );
    return { data, page, limit };
  }

  findByType(userId: string, typeCode: string) {
    return this.notificationsRepository.findByType(userId, typeCode);
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationsRepository.countUnread(userId);
    return { count };
  }

  async markAsRead(userId: string, id: string) {
    // Un aviso ajeno responde igual que uno inexistente para no revelar que existe.
    const notification = await this.notificationsRepository.findReadStateById(
      id,
      userId,
    );
    if (!notification) {
      throw new NotFoundException('Notificación no encontrada');
    }

    if (!notification.readAt) {
      await this.notificationsRepository.markAsRead(id, userId);
    }
    return { ok: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationsRepository.markAllAsRead(userId);
    return { ok: true };
  }
}
