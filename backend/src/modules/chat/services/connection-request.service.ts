import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  ForbiddenException,
  Inject,
  Optional,
  forwardRef,
} from '@nestjs/common';

import { ConnectionRequestRepository } from '../repositories/connection-request.repository.js';
import { ChatUserBlockRepository } from '../repositories/chat-user-block.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ChatGateway } from '../gateways/chat.gateway.js';
import { NotificationsService } from '../../notifications/services/notifications.service.js';
import { NotificationType } from '../../notifications/types/notification-type.enum.js';

@Injectable()
export class ConnectionRequestService {
  private readonly logger = new Logger(ConnectionRequestService.name);

  constructor(
    private readonly connectionRequestRepository: ConnectionRequestRepository,
    private readonly chatUserBlockRepository: ChatUserBlockRepository,
    private readonly userLookupRepository: UserLookupRepository,
    private readonly chatGateway: ChatGateway,
    @Optional()
    @Inject(forwardRef(() => ConversationRepository))
    private readonly conversationRepository?: ConversationRepository,
    @Optional()
    @Inject(forwardRef(() => NotificationsService))
    private readonly notificationsService?: NotificationsService,
  ) {}

  async send(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException(
        'No puedes enviarte una solicitud de conexión a ti mismo.',
      );
    }

    const receiver = await this.userLookupRepository.findActiveById(receiverId);

    if (!receiver) {
      throw new NotFoundException(
        'El usuario destinatario no existe o está inactivo.',
      );
    }

    const isBlocked = await this.chatUserBlockRepository.isBlockedBetween(
      senderId,
      receiverId,
    );

    if (isBlocked) {
      throw new ConflictException(
        'No es posible enviar una solicitud de conexión a este usuario.',
      );
    }

    const pendingRequest =
      await this.connectionRequestRepository.findPendingRequest(
        senderId,
        receiverId,
      );

    if (pendingRequest) {
      throw new ConflictException(
        'Ya existe una solicitud de conexión pendiente entre estos usuarios.',
      );
    }

    const acceptedRequest =
      await this.connectionRequestRepository.findAcceptedRequest(
        senderId,
        receiverId,
      );

    if (acceptedRequest) {
      throw new ConflictException(
        'Ya existe una conexión aceptada entre estos usuarios.',
      );
    }

    const pendingStatus =
      await this.connectionRequestRepository.findStatusByTitle('PENDING');

    if (!pendingStatus) {
      throw new InternalServerErrorException(
        'El estado de solicitud pendiente no está configurado.',
      );
    }

    const request = await this.connectionRequestRepository.create(
      senderId,
      receiverId,
      pendingStatus.id,
    );

    this.chatGateway.notifyUser(receiverId, 'connection_request:new', request);

    if (this.notificationsService) {
      try {
        const sender = await this.userLookupRepository.findActiveById(senderId);
        const senderName = sender
          ? `${sender.firstName} ${sender.lastName}`.trim()
          : 'Usuario';

        await this.notificationsService.notify({
          recipientIds: [receiverId],
          actorId: senderId,
          type: NotificationType.CONNECTION_REQUEST_RECEIVED,
          payload: {
            senderName,
          },
          actionUrl: '/chat?tab=requests',
        });
      } catch (error) {
        this.logger.error(
          `Failed to send connection request notification to user ${receiverId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return request;
  }

  async findSent(userId: string) {
    return this.connectionRequestRepository.findSentByUser(userId);
  }

  async findReceived(userId: string) {
    return this.connectionRequestRepository.findReceivedByUser(userId);
  }

  async accept(requestId: string, currentUserId: string) {
    return this.respond(requestId, currentUserId, 'ACCEPTED');
  }

  async reject(requestId: string, currentUserId: string) {
    return this.respond(requestId, currentUserId, 'REJECTED');
  }

  async findAccepted(userId: string) {
    return this.connectionRequestRepository.findAcceptedByUser(userId);
  }

  async hasAcceptedConnection(
    userAId: string,
    userBId: string,
  ): Promise<boolean> {
    const acceptedRequest =
      await this.connectionRequestRepository.findAcceptedRequest(
        userAId,
        userBId,
      );
    return Boolean(acceptedRequest);
  }

  private async respond(
    requestId: string,
    currentUserId: string,
    statusTitle: 'ACCEPTED' | 'REJECTED',
  ) {
    const request = await this.connectionRequestRepository.findById(requestId);

    if (!request) {
      throw new NotFoundException('La solicitud de conexión no existe.');
    }

    if (request.receiverId !== currentUserId) {
      throw new ForbiddenException(
        'No tienes permiso para responder esta solicitud.',
      );
    }

    if (request.status.title !== 'PENDING') {
      throw new ConflictException('La solicitud de conexión ya fue procesada.');
    }

    const status =
      await this.connectionRequestRepository.findStatusByTitle(statusTitle);

    if (!status) {
      throw new InternalServerErrorException(
        'El estado de solicitud no está configurado.',
      );
    }

    const result = await this.connectionRequestRepository.updatePendingStatus(
      requestId,
      status.id,
    );

    if (result.count === 0) {
      throw new ConflictException('La solicitud de conexión ya fue procesada.');
    }

    const updatedRequest =
      await this.connectionRequestRepository.findById(requestId);

    this.chatGateway.notifyUser(
      request.senderId,
      'connection_request:updated',
      updatedRequest,
    );

    if (statusTitle === 'ACCEPTED' && this.notificationsService) {
      try {
        const receiver =
          await this.userLookupRepository.findActiveById(currentUserId);
        const receiverName = receiver
          ? `${receiver.firstName} ${receiver.lastName}`.trim()
          : 'Usuario';

        let conversationId: string | null = null;
        if (this.conversationRepository) {
          const directConv =
            await this.conversationRepository.findByOrderedPair(
              request.senderId,
              currentUserId,
            );
          if (directConv) {
            conversationId = directConv.id;
          }
        }

        const actionUrl = conversationId
          ? `/chat?conversationId=${conversationId}`
          : '/chat';

        await this.notificationsService.notify({
          recipientIds: [request.senderId],
          actorId: currentUserId,
          type: NotificationType.CONNECTION_REQUEST_ACCEPTED,
          payload: {
            receiverName,
          },
          actionUrl,
        });
      } catch (error) {
        this.logger.error(
          `Failed to send connection request acceptance notification to user ${request.senderId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
    }

    return updatedRequest;
  }
}
