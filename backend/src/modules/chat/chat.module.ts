import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module.js';
import { JwtAuthModule } from '../../common/guards/jwt-auth.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { FileValidationService } from '../../common/services/file-validation.service.js';
import { EventRegistrationsModule } from '../event-registrations/event-registrations.module.js';
import { ChatRolePolicyService } from './services/chat-role-policy.service.js';

import { UserSearchController } from './controllers/user-search.controller.js';
import { ConversationController } from './controllers/conversation.controller.js';
import { MessageController } from './controllers/message.controller.js';
import { ChatController } from './controllers/chat.controller.js';
import { LinkPreviewController } from './controllers/link-preview.controller.js';
import { AttachmentController } from './controllers/attachment.controller.js';
import { ConnectionRequestController } from './controllers/connection-request.controller.js';
import { BlockController } from './controllers/block.controller.js';

import { UserSearchService } from './services/user-search.service.js';
import { ConversationService } from './services/conversation.service.js';
import { MessageService } from './services/message.service.js';
import { MessageStatusService } from './services/message-status.service.js';
import { UserPresenceService } from './services/user-presence.service.js';
import { ChatService } from './services/chat.service.js';
import { LinkPreviewService } from './services/link-preview.service.js';
import { AttachmentService } from './services/attachment.service.js';
import { AttachmentMapper } from './mappers/attachment.mapper.js';
import { ConversationMapper } from './mappers/conversation.mapper.js';
import { AttachmentUploadInterceptor } from './interceptors/attachment-upload.interceptor.js';
import { EventRoomService } from './services/event-room.service.js';
import { ConnectionRequestService } from './services/connection-request.service.js';
import { BlockService } from './services/block.service.js';

import { ConversationRepository } from './repositories/conversation.repository.js';
import { ConversationParticipantRepository } from './repositories/conversation-participant.repository.js';
import { MessageRepository } from './repositories/message.repository.js';
import { MessageStatusRepository } from './repositories/message-status.repository.js';
import { UserPresenceRepository } from './repositories/user-presence.repository.js';
import { UserLookupRepository } from './repositories/user-lookup.repository.js';
import { ChatRepository } from './repositories/chat.repository.js';
import { AttachmentRepository } from './repositories/attachment.repository.js';
import { ConnectionRequestRepository } from './repositories/connection-request.repository.js';
import { ChatUserBlockRepository } from './repositories/chat-user-block.repository.js';

import { ChatGateway } from './gateways/chat.gateway.js';

@Module({
  imports: [PrismaModule, JwtAuthModule, AuthModule, EventRegistrationsModule],
  controllers: [
    UserSearchController,
    ConversationController,
    MessageController,
    ChatController,
    LinkPreviewController,
    AttachmentController,
    ConnectionRequestController,
    BlockController,
  ],
  providers: [
    UserSearchService,
    ConversationService,
    MessageService,
    MessageStatusService,
    UserPresenceService,
    ChatService,
    ChatGateway,
    ChatRolePolicyService,
    LinkPreviewService,
    AttachmentService,
    AttachmentMapper,
    ConversationMapper,
    AttachmentUploadInterceptor,
    FileValidationService,
    EventRoomService,

    ConnectionRequestService,
    BlockService,

    ConversationRepository,
    ConversationParticipantRepository,
    MessageRepository,
    MessageStatusRepository,
    UserPresenceRepository,
    UserLookupRepository,
    ChatRepository,
    AttachmentRepository,
    ConnectionRequestRepository,
    ChatUserBlockRepository,
  ],
  exports: [
    ConversationService,
    MessageService,
    UserSearchService,
    UserPresenceService,
    ChatService,
    ChatGateway,
    LinkPreviewService,
    AttachmentService,
    AttachmentRepository,
    EventRoomService,
    BlockService,
  ],
})
export class ChatModule {}
