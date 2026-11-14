import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { UpdatePreferencesSchema } from '../requests/preferences.schema.js';
import type { NotificationPreferenceResponse } from '../types/notification.types.js';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  async getPreferences(@CurrentUserId() userId: string): Promise<NotificationPreferenceResponse> {
    return this.subscriptionsService.getPreferences(userId);
  }

  @Put()
  async updatePreferences(
    @CurrentUserId() userId: string,
    @Body() body: unknown,
  ): Promise<{ ok: boolean }> {
    const validatedData = UpdatePreferencesSchema.parse(body);
    return this.subscriptionsService.updatePreferences(userId, validatedData);
  }
}