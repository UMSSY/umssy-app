
import { ForbiddenException, Injectable } from '@nestjs/common';

import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import { ConnectionRequestRepository } from '../repositories/connection-request.repository.js';

import { UserPresenceService } from './user-presence.service.js';


import {
  InactiveUserException,
  SelfConversationException,
  UserNotFoundException,
} from '../exceptions/index.js';

import type { ConversationResponse } from '../responses/conversation.response.js';

@Injectable()
export class ConversationService {
  constructor(
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly userLookupRepository: UserLookupRepository,
    private readonly userPresenceService: UserPresenceService,
    private readonly connectionRequestRepository: ConnectionRequestRepository,
  ) {}

  async getOrCreate(
    currentUserId: string,
    contactId: string,
  ): Promise<ConversationResponse> {
    const { conversation } = await this.getOrCreateWithStatus(
      currentUserId,
      contactId,
    );

    return conversation;
  }

  async getOrCreateWithStatus(
    currentUserId: string,
    contactId: string,
  ): Promise<{
    conversation: ConversationResponse;
    isCreated: boolean;
  }> {
    const normalizedCurrentUserId = currentUserId.trim().toLowerCase();
    const normalizedContactId = contactId.trim().toLowerCase();

    // Evitar conversaciones consigo mismo
    if (normalizedCurrentUserId === normalizedContactId) {
      throw new SelfConversationException();
    }

    // Verificar que el destinatario exista
    const contact = await this.userLookupRepository.findById(
      normalizedContactId,
    );

    if (!contact) {
      throw new UserNotFoundException();
    }

    // Verificar que el destinatario esté activo
    if (!contact.isActive) {
      throw new InactiveUserException();
    }

    // Normalizar el orden de los usuarios
    const [userAId, userBId] =
      normalizedCurrentUserId < normalizedContactId
        ? [normalizedCurrentUserId, normalizedContactId]
        : [normalizedContactId, normalizedCurrentUserId];

    // Buscar una conversación existente
    const existing =
      await this.conversationRepository.findByOrderedPair(
        userAId,
        userBId,
      );

    if (existing) {
      const conversation = await this.toResponse(
        existing,
        normalizedCurrentUserId,
      );

      return {
        conversation,
        isCreated: false,
      };
    }

    // HU-09: Verificar conexión aceptada antes de crear el chat
    const acceptedRequest =
      await this.connectionRequestRepository.findAcceptedRequest(
        userAId,
        userBId,
      );

    if (!acceptedRequest) {
      throw new ForbiddenException(
        'Debes tener una solicitud de conexión aceptada para iniciar una conversación.',
      );
    }

    // Crear una conversación autorizada
    try {
      const created =
        await this.conversationRepository.createWithParticipants(
          userAId,
          userBId,
          new Date(),
        );

      const conversation = await this.toResponse(
        created,
        normalizedCurrentUserId,
      );

      return {
        conversation,
        isCreated: true,
      };
    } catch (error: unknown) {
      // Recuperación ante creación concurrente
      const err = error as {
        code?: string;
        message?: string;
      };

      if (
        err?.code === 'P2002' ||
        err?.message?.includes('P2002') ||
        err?.message?.includes('Unique constraint')
      ) {
        const concurrentExisting =
          await this.conversationRepository.findByOrderedPair(
            userAId,
            userBId,
          );

        if (concurrentExisting) {
          const conversation = await this.toResponse(
            concurrentExisting,
            normalizedCurrentUserId,
          );

          return {
            conversation,
            isCreated: false,
          };
        }
      }

      throw error;
    }
  }

  async isParticipant(
    conversationId: string,
    userId: string,
  ): Promise<boolean> {
    const participant =
      await this.participantRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    return participant !== null;
  }

  async findAllForUser(
    currentUserId: string,
  ): Promise<ConversationResponse[]> {
    const list =
      await this.conversationRepository.findUserConversations(
        currentUserId,
      );

    return Promise.all(
      list.map((conversation) =>
        this.toResponse(conversation, currentUserId),
      ),
    );
  }

  private async toResponse(
    conversation: {
      id: string;
      userAId: string | null;
      userBId: string | null;
      updatedAt: Date;

      userA: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl?: Uint8Array | null;
      } | null;

      userB: {
        id: string;
        firstName: string;
        lastName: string;
        photoUrl?: Uint8Array | null;
      } | null;

      messages: Array<{
        id: string;
        senderId: string;
        content: string | null;
        sentAt: Date;
      }>;

      event?: {
        id: string;
        title: string;
      } | null;
    },
    currentUserId: string,
  ): Promise<ConversationResponse> {
    // Si la conversación tiene eventId, es una sala grupal y se excluye del formato 1:1
    if (conversation.event?.id) {
      // Devolver respuesta mínima para sala grupal: solo conversationId y eventId,
      // sin campo contact (el frontend de HU-6 se encargará de la sala grupal)
      const lastMessage = conversation.messages[0];
      const safeContent = lastMessage?.content ?? '';
      const isAttachment = Boolean(safeContent.startsWith('[Archivo] '));
      const content = isAttachment
        ? safeContent.slice(10)
        : safeContent;
      const attachmentType = isAttachment ? ('file' as const) : null;

      return {
        id: conversation.id,
        eventId: conversation.event.id,
        // Sin contact en salas grupales (lista 1:1 las excluye)
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              senderId: lastMessage.senderId,
              content,
              isAttachment,
              attachmentType,
              createdAt: lastMessage.sentAt.toISOString(),
            }
          : null,
        unreadCount: 0,
        updatedAt: conversation.updatedAt.toISOString(),
      };
    }

    // Lógica existente para conversaciones 1:1
    const contact = (conversation.userAId === currentUserId
    ? conversation.userB
    : conversation.userA) as { id: string; firstName: string; lastName: string; photoUrl?: Uint8Array | null };
    const contact = (
      conversation.userAId === currentUserId
        ? conversation.userB
        : conversation.userA
    ) as {
      id: string;
      firstName: string;
      lastName: string;
      photoUrl?: Uint8Array | null;
    };

    // Obtener estado de conexión del contacto
    const onlineMap =
      await this.userPresenceService.mapOnlineStatus([
        contact.id,
      ]);

    // Consultar participación del usuario
    const participant =
      await this.participantRepository.findByConversationAndUser(
        conversation.id,
        currentUserId,
      );

    // Calcular mensajes no leídos
    const unreadCount = participant
      ? await this.participantRepository.countUnread(
          conversation.id,
          currentUserId,
          participant.lastReadAt,
        )
      : 0;

    // Obtener último mensaje
    const lastMessage = conversation.messages[0];

    const safeContent = lastMessage?.content ?? '';

    // Detectar archivos adjuntos
    const isAttachment = safeContent.startsWith('[Archivo] ');

    const content = isAttachment
      ? safeContent.slice(10)
      : safeContent;

    const attachmentType = isAttachment
      ? ('file' as const)
      : null;

    // Convertir foto binaria a base64
    const contactPhoto = contact.photoUrl;

    const avatarUrl = contactPhoto
      ? `data:image/jpeg;base64,${Buffer.from(contactPhoto).toString('base64')}`
      : null;

    return {
      id: conversation.id,

      contact: {
        id: contact.id,
        fullName: `${contact.firstName} ${contact.lastName}`.trim(),
        avatarUrl,
        isOnline: onlineMap.get(contact.id) ?? false,
      },

      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            senderId: lastMessage.senderId,
            content,
            isAttachment,
            attachmentType,
            createdAt: lastMessage.sentAt.toISOString(),
          }
        : null,

      unreadCount,
      updatedAt: conversation.updatedAt.toISOString(),
    };
  }
}
