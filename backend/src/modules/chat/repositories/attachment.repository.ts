import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { AttachmentRecord } from '../types/attachment.types.js';

@Injectable()
export class AttachmentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    id?: string;
    messageId: string;
    typeId: string;
    fileName: string;
    mimeType: string;
    fileSize: number;
    fileData: Buffer;
    url?: string;
  }): Promise<AttachmentRecord> {
    return this.prisma.messageAttachment.create({
      data: {
        id: data.id,
        messageId: data.messageId,
        typeId: data.typeId,
        fileName: data.fileName,
        mimeType: data.mimeType,
        fileSize: data.fileSize,
        fileData: new Uint8Array(data.fileData),
        url: data.url,
      },
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
    });
  }

  async findById(id: string): Promise<AttachmentRecord | null> {
    return this.prisma.messageAttachment.findUnique({
      where: { id },
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
    });
  }

  async findDownloadById(id: string) {
    return this.prisma.messageAttachment.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        mimeType: true,
        fileSize: true,
        fileData: true,
        message: {
          select: {
            conversationId: true,
          },
        },
      },
    });
  }

  async findAttachmentTypeByTitle(title: string): Promise<{ id: string; title: string } | null> {
    return this.prisma.attachmentType.findFirst({
      where: { title },
      select: { id: true, title: true },
    });
  }
}
