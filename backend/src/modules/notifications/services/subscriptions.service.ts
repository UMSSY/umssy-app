import { Injectable } from '@nestjs/common';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import type { NotificationPreferenceResponse } from '../types/notification-preference-response.type.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly pushRepo: PushSubscriptionsRepository,
    private readonly preferencesRepo: PreferencesRepository,
  ) {}

  async subscribe(userId: string, payload: any) {
    await this.pushRepo.upsert(userId, payload);
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint: string) {
    await this.pushRepo.deleteByEndpointAndUserId(endpoint, userId);
    return { ok: true };
  }

  async getPreferences(userId: string): Promise<NotificationPreferenceResponse> {
    const prefs = await this.preferencesRepo.findManyByUserIds([userId]);
    const userPref = prefs.find((p) => p.userId === userId);

    return {
      pushEnabled: userPref ? userPref.pushEnabled : false,
      emailEnabled: userPref ? userPref.emailEnabled : true,
      inAppEnabled: userPref ? userPref.inAppEnabled : true,
    };
  }

  async updatePreferences(userId: string, payload: any) {
    await this.preferencesRepo.upsert(userId, {
      pushEnabled: payload.pushEnabled,
      emailEnabled: payload.emailEnabled,
      inAppEnabled: payload.inAppEnabled,
    });
    return { ok: true };
  }
}