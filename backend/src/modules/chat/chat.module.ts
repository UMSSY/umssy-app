import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { AuthModule } from '../auth/auth.module.js';

import { UserSearchController } from './controllers/user-search.controller.js';
import { ConversationController } from './controllers/conversation.controller.js';
import { MessageController } from './controllers/message.controller.js';
import { ChatController } from './controllers/chat.controller.js';
import { LinkPreviewController } from './controllers/link-preview.controller.js';

import { UserSearchService } from './services/user-search.service.js';
import { ConversationService } from './services/conversation.service.js';
import { MessageService } from './services/message.service.js';
import { MessageStatusService } from './services/message-status.service.js';
import { UserPresenceService } from './services/user-presence.service.js';
import { ChatService } from './services/chat.service.js';
import { LinkPreviewService } from './services/link-preview.service.js';

import { ConversationRepository } from './repositories/conversation.repository.js';
import { ConversationParticipantRepository } from './repositories/conversation-participant.repository.js';
import { MessageRepository } from './repositories/message.repository.js';
import { MessageStatusRepository } from './repositories/message-status.repository.js';
import { UserPresenceRepository } from './repositories/user-presence.repository.js';
import { UserLookupRepository } from './repositories/user-lookup.repository.js';
import { ChatRepository } from './repositories/chat.repository.js';

import { ChatGateway } from './gateways/chat.gateway.js';

import { ConnectionRequestService } from './services/connection-request.service.js';
import { ConnectionRequestRepository } from './repositories/connection-request.repository.js';
import { ChatUserBlockRepository } from './repositories/chat-user-block.repository.js';
import { ConnectionRequestController } from './controllers/connection-request.controller.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, AuthModule],
  controllers: [
    UserSearchController,
    ConversationController,
    MessageController,
    ChatController,
    LinkPreviewController,
    ConnectionRequestController,
  ],
  providers: [
    UserSearchService,
    ConversationService,
    MessageService,
    MessageStatusService,
    UserPresenceService,
    ChatService,
    ChatGateway,
    LinkPreviewService,

    ConnectionRequestService,
    ConnectionRequestRepository,
    ChatUserBlockRepository,

    ConversationRepository,
    ConversationParticipantRepository,
    MessageRepository,
    MessageStatusRepository,
    UserPresenceRepository,
    UserLookupRepository,
    ChatRepository,
  ],
  exports: [
    ConversationService,
    MessageService,
    UserSearchService,
    UserPresenceService,
    ChatService,
    ChatGateway,
    LinkPreviewService,
  ],
})
export class ChatModule {}
