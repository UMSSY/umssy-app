import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from '../services/subscriptions.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { CurrentUserId } from '../../../common/decorators/current-user-id.decorator.js';
import { RequestValidationPipe } from '../../../common/pipes/request-validation.pipe.js';
import {
  PushSubscriptionSchema,
  DeletePushSubscriptionSchema,
} from '../requests/push-subscription.schema.js';
import type { PushSubscriptionPayload } from '../types/push-subscription-payload.type.js';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushSubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly configService: ConfigService,
  ) {}

  @Get('public-key')
  getPublicKey(): { publicKey: string } {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY');
    if (!publicKey) {
      throw new Error('VAPID_PUBLIC_KEY is not configured');
    }
    return { publicKey };
  }

  @Post('subscriptions')
  @HttpCode(HttpStatus.OK)
  async subscribe(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(PushSubscriptionSchema))
    payload: PushSubscriptionPayload,
  ) {
    return this.subscriptionsService.subscribe(userId, payload);
  }

  @Delete('subscriptions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async unsubscribe(
    @CurrentUserId() userId: string,
    @Body(new RequestValidationPipe(DeletePushSubscriptionSchema))
    payload: { endpoint: string },
  ): Promise<void> {
    await this.subscriptionsService.unsubscribe(userId, payload.endpoint);
  }
}