import { Injectable } from '@nestjs/common';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { UploadedFile } from '../../../common/types/uploaded-file.type.js';
import type { AttachmentRecord } from '../types/attachment.types.js';
import type { AttachmentResponse } from '../responses/attachment.response.js';

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
}
