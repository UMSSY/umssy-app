import { Injectable } from '@nestjs/common';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import { EmptyFileException } from '../../../common/exceptions/empty-file.exception.js';
import {
  MAX_IMAGE_SIZE_BYTES,
  MAX_PDF_SIZE_BYTES,
  ALLOWED_IMAGE_MIME_TYPES,
  ALLOWED_PDF_MIME_TYPES,
} from '../constants/attachment.constants.js';
import {
  AttachmentNotFoundException,
  AttachmentTooLargeException,
  InvalidAttachmentTypeException,
  ConversationNotFoundException,
  NotConversationParticipantException,
  UserBlockedException,
} from '../exceptions/index.js';
import { AttachmentRepository } from '../repositories/attachment.repository.js';
import { AttachmentMapper } from '../mappers/attachment.mapper.js';
import { ConversationRepository } from '../repositories/conversation.repository.js';
import { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import { MessageRepository } from '../repositories/message.repository.js';
import { MessageStatusService } from './message-status.service.js';
import { BlockService } from './block.service.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import type { SendAttachmentMessageDto } from '../requests/send-attachment-message.schema.js';
import type { AttachmentFileDownload } from '../types/attachment.types.js';
import type { AttachmentResponse } from '../responses/attachment.response.js';

@Injectable()
export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly attachmentMapper: AttachmentMapper,
    private readonly conversationRepository: ConversationRepository,
    private readonly participantRepository: ConversationParticipantRepository,
    private readonly messageRepository: MessageRepository,
    private readonly messageStatusService: MessageStatusService,
    private readonly fileValidationService: FileValidationService,
    private readonly blockService: BlockService,
    private readonly chatRolePolicyService: ChatRolePolicyService,
  ) {}

  async uploadAndSend(
    userId: string,
    file: MulterFile | undefined,
    dto: SendAttachmentMessageDto,
  ) {
    if (!file || file.size === 0 || !file.buffer || file.buffer.length === 0) {
      throw new EmptyFileException();
    }

    const detectedMime = this.fileValidationService.detectMimeType(file.buffer);
    const isImage = detectedMime
      ? (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(detectedMime)
      : (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(file.mimetype);
    const isPdf = detectedMime
      ? (ALLOWED_PDF_MIME_TYPES as readonly string[]).includes(detectedMime)
      : (ALLOWED_PDF_MIME_TYPES as readonly string[]).includes(file.mimetype);

    if (!isImage && !isPdf) {
      throw new InvalidAttachmentTypeException();
    }

    if (isImage && file.size > MAX_IMAGE_SIZE_BYTES) {
      throw new AttachmentTooLargeException(
        'La imagen supera el tamaño maximo permitido de 5 MB.',
      );
    }

    if (isPdf && file.size > MAX_PDF_SIZE_BYTES) {
      throw new AttachmentTooLargeException(
        'El documento supera el tamaño maximo permitido 10 MB.',
      );
    }

    // Validación profunda de integridad estructural y seguridad contra políglotas.
    const uploadedFile = this.attachmentMapper.toUploadedFile(file);
    const validatedFile = this.fileValidationService.validate(uploadedFile, {
      allowedTypes: isImage ? ['jpg', 'png'] : ['pdf'],
      maxSizeBytes: isImage ? MAX_IMAGE_SIZE_BYTES : MAX_PDF_SIZE_BYTES,
    });

    const conversation = await this.conversationRepository.findById(
      dto.conversationId,
    );
    if (!conversation) {
      throw new ConversationNotFoundException();
    }

    const participant =
      await this.participantRepository.findByConversationAndUser(
        dto.conversationId,
        userId,
      );
    if (!participant) {
      throw new NotConversationParticipantException();
    }

    // HU-13: impedir adjuntos entre usuarios bloqueados.
    const otherParticipantId = this.getOtherParticipantId(
      conversation,
      userId,
    );
    if (
      otherParticipantId &&
      (await this.blockService.isBlockedBetween(userId, otherParticipantId))
    ) {
      throw new UserBlockedException();
    }

    // HU-08: verificar roles actuales antes de crear mensajes o adjuntos.
    // No aplica a las conversaciones de eventos sin pareja de usuarios.
    if (otherParticipantId) {
      await this.chatRolePolicyService.assertCanCommunicate(
        userId,
        otherParticipantId,
      );
    }

    const typeTitle = isImage ? 'IMAGE' : 'PDF';
    const attachmentType =
      await this.attachmentRepository.findAttachmentTypeByTitle(typeTitle);
    if (!attachmentType) {
      throw new InvalidAttachmentTypeException(
        `Tipo de adjunto ${typeTitle} no disponible en catálogo`,
      );
    }

    const sentStatusId = await this.messageStatusService.getSentId();
    const now = new Date();
    const rawContent = dto.content?.trim();
    const content = rawContent && rawContent.length > 0 ? rawContent : null;

    const message = await this.messageRepository.create({
      conversationId: dto.conversationId,
      senderId: userId,
      content,
      statusId: sentStatusId,
      sentAt: now,
    });

    // Guardar el archivo binario en PostgreSQL.
    const attachmentRecord = await this.attachmentRepository.create({
      messageId: message.id,
      typeId: attachmentType.id,
      fileName: validatedFile.originalName,
      mimeType: validatedFile.detectedMimeType,
      fileSize: validatedFile.size,
      fileData: validatedFile.buffer,
    });

    await this.conversationRepository.touchLastMessage(
      dto.conversationId,
      message.id,
      now,
    );

    await this.participantRepository.markRead(
      dto.conversationId,
      userId,
      now,
    );

    // Mantener el mapper incorporado por la rama del equipo.
    return this.attachmentMapper.toMessageResponse({
      message,
      attachmentRecord,
      isImage,
    });
  }

  async getDownload(
    userId: string,
    attachmentId: string,
  ): Promise<AttachmentFileDownload> {
    const record = await this.attachmentRepository.findDownloadById(
      attachmentId,
    );
    if (!record || !record.fileData) {
      throw new AttachmentNotFoundException();
    }

    const participant =
      await this.participantRepository.findByConversationAndUser(
        record.message.conversationId,
        userId,
      );
    if (!participant) {
      throw new NotConversationParticipantException();
    }

    return {
      fileName: record.fileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      content: Buffer.from(record.fileData),
    };
  }

  async getById(
    userId: string,
    attachmentId: string,
  ): Promise<AttachmentResponse> {
    const record = await this.attachmentRepository.findById(attachmentId);
    if (!record) {
      throw new AttachmentNotFoundException();
    }

    return this.attachmentMapper.toResponse(record);
  }

  private getOtherParticipantId(
    conversation: { userAId?: string | null; userBId?: string | null },
    userId: string,
  ): string | null {
    const { userAId, userBId } = conversation;
    if (!userAId || !userBId) return null;
    const sender = userId.trim().toLowerCase();
    return userAId.toLowerCase() === sender ? userBId : userAId;
  }
}
