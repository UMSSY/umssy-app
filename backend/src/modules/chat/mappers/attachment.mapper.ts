import { Injectable } from '@nestjs/common';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { UploadedFile } from '../../../common/types/uploaded-file.type.js';
import type { AttachmentRecord } from '../types/attachment.types.js';
import type { AttachmentResponse } from '../responses/attachment.response.js';
import type { MessageResponse } from '../responses/message.response.js';

@Injectable()
export class AttachmentMapper {
  toUploadedFile(file: MulterFile): UploadedFile {
    return {
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };
  }

  toResponse(record: AttachmentRecord): AttachmentResponse {
    return {
      id: record.id,
      messageId: record.messageId,
      fileName: record.fileName,
      mimeType: record.mimeType,
      fileSize: record.fileSize,
      url: record.url ?? `/api/chat/attachments/${record.id}/download`,
      thumbnailUrl: record.thumbnailUrl,
      type: record.type?.title ?? 'FILE',
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : String(record.createdAt),
    };
  }

  toMessageResponse(params: {
    message: {
      id: string;
      conversationId: string;
      senderId: string;
      content: string | null;
      sentAt: Date;
      createdAt: Date;
    };
    attachmentRecord: AttachmentRecord;
    isImage: boolean;
  }): MessageResponse {
    const { message, attachmentRecord, isImage } = params;
    const attachmentResponse = this.toResponse(attachmentRecord);

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      content: message.content ?? '',
      timestamp: message.sentAt.toISOString(),
      createdAt: message.createdAt.toISOString(),
      status: 'sent',
      isAttachment: true,
      attachmentType: isImage ? 'image' : 'file',
      attachment: attachmentResponse,
    };
  }
}
