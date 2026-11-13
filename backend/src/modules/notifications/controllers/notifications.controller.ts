import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsRepository } from '../repositories/notifications.repository.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsRepository: NotificationsRepository) {}

  @Get()
  async getNotifications(
    @CurrentUserId() userId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    const skip = (Number(page) - 1) * Number(limit);
    const data = await this.notificationsRepository.findManyByUser(userId, skip, Number(limit));
    return { data, page: Number(page), limit: Number(limit) };
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUserId() userId: string) {
    const count = await this.notificationsRepository.countUnread(userId);
    return { count };
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUserId() userId: string, @Param('id') id: string) {
    await this.notificationsRepository.markAsRead(id, userId);
    return { ok: true };
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUserId() userId: string) {
    await this.notificationsRepository.markAllAsRead(userId);
    return { ok: true };
  }
}