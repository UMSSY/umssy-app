import { Injectable } from '@nestjs/common';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import { PreferencesRepository } from '../repositories/preferences.repository.js';
import type {
  NotificationPreferenceResponse,
  NotificationPreferencePayload,
  PushSubscriptionPayload,
} from '../types/notification.types.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly pushRepo: PushSubscriptionsRepository,
    private readonly preferencesRepo: PreferencesRepository,
  ) {}

  async subscribe(
    userId: string,
    payload: PushSubscriptionPayload,
  ): Promise<{ ok: true }> {
    await this.pushRepo.upsert(userId, payload);
    return { ok: true };
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.pushRepo.deleteByEndpointAndUserId(endpoint, userId);
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

  async updatePreferences(
    userId: string,
    payload: NotificationPreferencePayload,
  ): Promise<{ ok: true }> {
    await this.preferencesRepo.upsert(userId, {
      pushEnabled: payload.pushEnabled,
      emailEnabled: payload.emailEnabled,
      inAppEnabled: payload.inAppEnabled,
    });
    return { ok: true };
  }
}