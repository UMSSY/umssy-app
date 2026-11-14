import { Controller, Get, Post, Delete, Body, UseGuards } from '@nestjs/common';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { PushSubscriptionSchema, DeletePushSubscriptionSchema } from '../requests/push-subscription.schema.js';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('public-key')
  getPublicKey() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY };
  }

  @Post('subscriptions')
  async subscribe(
    @CurrentUserId() userId: string,
    @Body() payload: unknown, 
  ) {
    const validatedPayload = PushSubscriptionSchema.parse(payload);
    return this.subscriptionsService.subscribe(userId, validatedPayload);
  }

  @Delete('subscriptions')
  async unsubscribe(
    @CurrentUserId() userId: string,
    @Body() payload: unknown, 
  ) {
    const { endpoint } = DeletePushSubscriptionSchema.parse(payload);
    return this.subscriptionsService.unsubscribe(userId, endpoint);
  }
}