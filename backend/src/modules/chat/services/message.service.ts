
import { Injectable } from '@nestjs/common';
import { MessageRepository } from '../repositories/message.repository.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { MessageStatusService } from './message-status.service.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import { BlockService } from './block.service.js';
import {
  ConversationNotFoundException,
  InvalidMessageContentException,
  NotConversationParticipantException,
  UserBlockedException,
} from '../exceptions/index.js';
import { MAX_MESSAGE_LENGTH } from '../constants/chat.constants.js';
import type { MessageResponse } from '../responses/message.response.js';
import { countCharacters } from '../utils/unicode-counter.js';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly messageStatusService: MessageStatusService,
    private readonly blockService: BlockService,
    private readonly chatRolePolicyService: ChatRolePolicyService,
  ) {}

  async send(params: {
    conversationId: string;
    senderId: string;
    content: string;
  }): Promise<MessageResponse> {
    // Verificar que la conversación exista
    const conversation = await this.conversationRepository.findById(
      params.conversationId,
    );

    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    // Verificar que el usuario participe en la conversación
    const participant =
      await this.participantRepository.findByConversationAndUser(
        params.conversationId,
        params.senderId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    // Obtener el otro participante de la conversación
    const otherParticipantId = this.getOtherParticipantId(
      conversation,
      params.senderId,
    );

    // HU-13: impedir mensajes entre usuarios bloqueados
    if (
      otherParticipantId &&
      (await this.blockService.isBlockedBetween(
        params.senderId,
        otherParticipantId,
      ))
    ) {
      throw new UserBlockedException();
    }

    // HU-08: verificar los roles actuales de ambos usuarios
    // antes de permitir el envío del mensaje
    if (otherParticipantId) {
      await this.chatRolePolicyService.assertCanCommunicate(
        params.senderId,
        otherParticipantId,
      );
    }

    // Sanitizar el contenido del mensaje
    const content = this.sanitize(params.content);
    const characterCount = countCharacters(content);

    // Verificar contenido vacío
    if (characterCount === 0) {
      throw new InvalidMessageContentException(
        'El contenido del mensaje no puede estar vacío',
      );
    }

    // Verificar longitud máxima
    if (characterCount > MAX_MESSAGE_LENGTH) {
      throw new InvalidMessageContentException(
        `El contenido del mensaje no puede superar los ${MAX_MESSAGE_LENGTH} caracteres`,
      );
    }

    // Obtener estado inicial del mensaje
    const sentStatusId = await this.messageStatusService.getSentId();
    const now = new Date();

    // Crear mensaje en la base de datos
    const created = await this.messageRepository.create({
      conversationId: params.conversationId,
      senderId: params.senderId,
      content,
      statusId: sentStatusId,
      sentAt: now,
    });

    // Actualizar último mensaje de la conversación
    await this.conversationRepository.touchLastMessage(
      params.conversationId,
      created.id,
      now,
    );

    // Marcar el mensaje como leído para el remitente
    await this.participantRepository.markRead(
      params.conversationId,
      params.senderId,
      now,
    );

    // Retornar respuesta del mensaje
    return {
      id: created.id,
      conversationId: created.conversationId,
      senderId: created.senderId,
      content: created.content ?? '',
      timestamp: created.sentAt.toISOString(),
      createdAt: created.createdAt.toISOString(),
      status: 'sent',
      isAttachment: false,
      attachmentType: null,
    };
  }

  async getPage(params: {
    conversationId: string;
    userId: string;
    cursor: string | null;
    limit: number;
  }) {
    // Verificar que el usuario participe en la conversación
    const participant =
      await this.participantRepository.findByConversationAndUser(
        params.conversationId,
        params.userId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    // Obtener mensajes paginados
    const page = await this.messageRepository.findPage({
      conversationId: params.conversationId,
      cursor: params.cursor,
      limit: params.limit,
    });

    return {
      data: page.data.map((m) => {
        const rawContent = m.content ?? '';

        const rawAttachments = (m as {
          attachments?: Array<{
            id: string;
            messageId: string;
            typeId: string;
            fileName: string;
            mimeType: string | null;
            fileSize: number | null;
            url: string | null;
            thumbnailUrl: string | null;
            createdAt: Date;
            type?: { title: string } | null;
          }>;
        }).attachments;

        const firstAttachment = rawAttachments?.[0];

        // Detectar si el mensaje contiene archivos adjuntos
        const isAttachment = Boolean(
          firstAttachment || rawContent.startsWith('[Archivo] '),
        );

        const content = rawContent.startsWith('[Archivo] ')
          ? rawContent.slice(10)
          : rawContent;

        // Determinar tipo de adjunto
        const attachmentType = firstAttachment
          ? firstAttachment.type?.title?.toLowerCase() === 'image'
            ? ('image' as const)
            : ('file' as const)
          : isAttachment
            ? ('file' as const)
            : null;

        // Determinar estado del mensaje
        const statusTitle = (
          m as { status?: { title?: string } }
        ).status?.title?.toLowerCase();

        const status =
          statusTitle === 'read'
            ? ('read' as const)
            : ('sent' as const);

        // Mapear los archivos adjuntos
        const mappedAttachments = rawAttachments?.map((att) => ({
          id: att.id,
          messageId: att.messageId,
          fileName: att.fileName,
          mimeType: att.mimeType ?? 'application/octet-stream',
          fileSize: att.fileSize ?? 0,
          url:
            att.url ??
            `/api/chat/attachments/${att.id}/download`,
          thumbnailUrl: att.thumbnailUrl,
          type: att.type?.title ?? 'FILE',
          createdAt:
            att.createdAt instanceof Date
              ? att.createdAt.toISOString()
              : String(att.createdAt),
        }));

        return {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content,
          timestamp: m.sentAt.toISOString(),
          createdAt: m.createdAt.toISOString(),
          status,
          isAttachment,
          attachmentType,
          attachments: mappedAttachments,
          attachment: mappedAttachments?.[0],
        };
      }),
      hasMore: page.hasMore,
      nextCursor: page.nextCursor,
    };
  }

  async markRead(
    conversationId: string,
    userId: string,
  ): Promise<void> {
    // Verificar participación del usuario
    const participant =
      await this.participantRepository.findByConversationAndUser(
        conversationId,
        userId,
      );

    if (!participant) {
      throw new NotConversationParticipantException();
    }

    // Actualizar fecha de lectura
    await this.participantRepository.markRead(
      conversationId,
      userId,
      new Date(),
    );
  }

  private getOtherParticipantId(
    conversation: {
      userAId?: string | null;
      userBId?: string | null;
    },
    senderId: string,
  ): string | null {
    const { userAId, userBId } = conversation;

    // Conversaciones de eventos sin participantes privados
    if (!userAId || !userBId) {
      return null;
    }

    const sender = senderId.trim().toLowerCase();

    return userAId.toLowerCase() === sender
      ? userBId
      : userAId;
  }

  private sanitize(raw: string): string {
    // Eliminar caracteres de control no permitidos
    const cleaned = raw
      .split('')
      .filter((char) => {
        const code = char.charCodeAt(0);
        return code >= 32 || code === 10 || code === 13;
      })
      .join('');

    return cleaned.trim();
  }
}
