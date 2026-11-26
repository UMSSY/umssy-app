import type { MessageResponse } from '../responses/message.response.js';
import { Injectable } from '@nestjs/common';
import type { MessageRecord } from '../types/message-record.types.js';

@Injectable()
export class MessageMapper {
  toResponse(m: MessageRecord): MessageResponse {
    const rawContent = m.content ?? '';

    const rawAttachments = m.attachments;

    const firstAttachment = rawAttachments?.[0];

    const isAttachment = Boolean(
      firstAttachment || rawContent.startsWith('[Archivo] '),
    );

    const content = rawContent.startsWith('[Archivo] ')
      ? rawContent.slice(10)
      : rawContent;

    const attachmentType = firstAttachment
      ? firstAttachment.type?.title?.toLowerCase() === 'image'
        ? ('image' as const)
        : ('file' as const)
      : isAttachment
        ? ('file' as const)
        : null;

    const statusTitle = m.status?.title?.toLowerCase();

    const status =
      statusTitle === 'read' ? ('read' as const) : ('sent' as const);

    const mappedAttachments = rawAttachments?.map((att) => ({
      id: att.id,
      messageId: att.messageId,
      fileName: att.fileName,
      mimeType: att.mimeType ?? 'application/octet-stream',
      fileSize: att.fileSize ?? 0,
      url: att.url ?? `/api/chat/attachments/${att.id}/file`,
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
  }
}
