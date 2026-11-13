import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import type { NotificationPreferenceResponse } from '../types/notification.types.js';

@Controller('notifications/preferences')
@UseGuards(JwtAuthGuard)
export class PreferencesController {
  constructor(private readonly preferencesRepo: PreferencesRepository) {}

  @Get()
  async getPreferences(@CurrentUserId() userId: string): Promise<NotificationPreferenceResponse> {
    const prefs = await this.preferencesRepo.findManyByUserIds([userId]);
    const userPref = prefs.find((p) => p.userId === userId);

    return {
      pushEnabled: userPref ? userPref.pushEnabled : false,
      emailEnabled: userPref ? userPref.emailEnabled : true,
      inAppEnabled: userPref ? userPref.inAppEnabled : true,
    };
  }

  @Put()
  async updatePreferences(
    @CurrentUserId() userId: string,
    @Body() body: NotificationPreferenceResponse,
  ): Promise<{ ok: boolean }> {
    await this.preferencesRepo.upsert(userId, {
      pushEnabled: body.pushEnabled,
      emailEnabled: body.emailEnabled,
      inAppEnabled: body.inAppEnabled,
    });
    return { ok: true };
  }
}