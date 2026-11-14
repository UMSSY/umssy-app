import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { PushSubscriptionsRepository } from '../repositories/push-subscriptions.repository.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import type { PushSubscriptionPayload } from '../types/push-subscription-payload.type.js';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionsController {
  constructor(private readonly pushRepo: PushSubscriptionsRepository) {}

  @Get('public-key')
  getPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  }

  @Post('subscriptions')
  async subscribe(
    @CurrentUserId() userId: string,
    @Body() payload: PushSubscriptionPayload,
  ) {
    await this.pushRepo.upsert(userId, payload);
    return { ok: true };
  }

  @Delete('subscriptions')
  async unsubscribe(@Body('endpoint') endpoint: string) {
    await this.pushRepo.deleteByEndpoint(endpoint);
    return { ok: true };
  }
}