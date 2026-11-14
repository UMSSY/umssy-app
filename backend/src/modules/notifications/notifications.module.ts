import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { MailModule } from '../mail/mail.module.js';

import { NotificationsService } from './services/notifications.service.js';
import { PushDispatcherService } from './services/push-dispatcher.service.js';
import { MailDispatcherService } from './services/mail-dispatcher.service.js';
import { NotificationGateway } from './gateways/notification.gateway.js';
import { SubscriptionsService } from './services/subscriptions.service.js';

import { NotificationsRepository } from './repositories/notifications.repository.js';
import { PushSubscriptionsRepository } from './repositories/push-subscriptions.repository.js';
import { PreferencesRepository } from './repositories/preferences.repository.js';
import { NotificationUserLookupRepository } from './repositories/notification-user-lookup.repository.js';

import { NotificationsController } from './controllers/notifications.controller.js';
import { PushSubscriptionsController } from './controllers/push-subscriptions.controller.js';
import { PreferencesController } from './controllers/preferences.controller.js';
import { NotificationsInboxService } from './services/notifications-inbox.service.js';
import { UsersModule } from '../users/users.module.js'; 
import { ChatModule } from '../chat/chat.module.js'; 

@Module({
  imports: [
    PrismaModule,
    JwtAuthModule,
    AuthModule, 
    JwtModule.register({}), 
    MailModule,
    UsersModule,
    forwardRef(() => ChatModule),
  ],
  controllers: [
    NotificationsController,
    PushSubscriptionsController,
    PreferencesController,
  ],
  providers: [
    NotificationsService,
    PushDispatcherService,
    MailDispatcherService,
    NotificationGateway,
    NotificationsRepository,
    PushSubscriptionsRepository,
    PreferencesRepository,
    NotificationUserLookupRepository,
    SubscriptionsService,
    NotificationsInboxService,
  ],
  exports: [NotificationsService, SubscriptionsService],
})
export class NotificationsModule {}