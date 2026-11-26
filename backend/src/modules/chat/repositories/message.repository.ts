import { MESSAGE_RELATIONS } from '../constants/message-relations.constants.js';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    conversationId: string;
    senderId: string;
    content?: string | null;
    statusId: string;
    sentAt: Date;
    attachments?: {
      typeId: string;
      fileName: string;
      mimeType?: string;
      fileSize?: number;
      fileDataBase64?: string;
      url?: string;
    }[];
  }) {
    const { attachments, ...messageData } = data;

    let attachmentCreateData:
      | Prisma.MessageAttachmentUncheckedCreateNestedManyWithoutMessageInput
      | undefined = undefined;

    if (attachments && attachments.length > 0) {
      attachmentCreateData = {
        create: attachments.map((att) => ({
          typeId: att.typeId,
          fileName: att.fileName,
          mimeType: att.mimeType ?? 'application/octet-stream',
          fileSize: att.fileSize ?? 0,
          fileData: att.fileDataBase64
            ? new Uint8Array(Buffer.from(att.fileDataBase64, 'base64'))
            : null,
          url: att.url ?? null,
        })),
      };
    }

    return this.prisma.message.create({
      data: {
        ...messageData,
        content:
          typeof messageData.content === 'string' &&
          messageData.content.trim().length > 0
            ? messageData.content.trim()
            : null,
        attachments: attachmentCreateData,
      },
      include: MESSAGE_RELATIONS,
    });
  }

  async findPage(params: {
    conversationId: string;
    cursor: string | null;
    limit: number;
  }) {
    const { conversationId, cursor, limit } = params;

    const rows = await this.prisma.message.findMany({
      where: { conversationId },
      include: MESSAGE_RELATIONS,
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor =
      hasMore && data.length > 0 ? data[data.length - 1].id : null;
    return { data, hasMore, nextCursor };
  }
}
