import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

const ATTACHMENT_METADATA_SELECT = {
  select: {
    id: true,
    messageId: true,
    typeId: true,
    fileName: true,
    mimeType: true,
    fileSize: true,
    url: true,
    thumbnailUrl: true,
    createdAt: true,
    type: {
      select: { title: true },
    },
  },
} as const;

@Injectable()
export class MessageRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    conversationId: string;
    senderId: string;
    content: string;
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

    let mappedAttachments = undefined;

    if (attachments) {
      mappedAttachments = attachments.map((att) => ({
        typeId: att.typeId,
        fileName: att.fileName,
        mimeType: att.mimeType ?? null,
        fileSize: att.fileSize ?? null,
        fileData: att.fileDataBase64
          ? new Uint8Array(Buffer.from(att.fileDataBase64, 'base64'))
          : null,
        url: att.url ?? null,
      }));
    }

    return this.prisma.message.create({
      data: {
        ...messageData,
        attachments: mappedAttachments
          ? ({ create: mappedAttachments } as any)
          : undefined,
      },
      include: {
        status: { select: { title: true } },
        attachments: ATTACHMENT_METADATA_SELECT,
      },
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
      include: {
        status: { select: { title: true } },
        attachments: ATTACHMENT_METADATA_SELECT,
      },
      orderBy: { sentAt: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;

    return {
      data,
      hasMore,
      nextCursor: hasMore && data.length > 0 ? data[data.length - 1].id : null,
    };
  }
}
