import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { NotificationsInboxService } from '../services/notifications-inbox.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { GetNotificationsQuerySchema, NotificationIdParamSchema } from '../requests/notifications-query.schema.js';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly inboxService: NotificationsInboxService) {}

  @Get()
  async getNotifications(
    @CurrentUserId() userId: string,
    @Query() query: unknown,
  ) {
    const { page, limit } = GetNotificationsQuerySchema.parse(query);
    return this.inboxService.getNotifications(userId, page, limit);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUserId() userId: string) {
    return this.inboxService.getUnreadCount(userId);
  }

  @Patch(':id/read')
  async markAsRead(
    @CurrentUserId() userId: string, 
    @Param() params: unknown
  ) {
    const { id } = NotificationIdParamSchema.parse(params);
    return this.inboxService.markAsRead(userId, id);
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUserId() userId: string) {
    return this.inboxService.markAllAsRead(userId);
  }
}