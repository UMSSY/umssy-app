import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AttachmentRepository } from './attachment.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('AttachmentRepository', () => {
  let repository: AttachmentRepository;

  const mockPrisma = {
    messageAttachment: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    attachmentType: {
      findFirst: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new AttachmentRepository(mockPrisma as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates message attachment with binary fileData converted to Uint8Array', async () => {
      const buffer = Buffer.from('hello-world');
      const now = new Date('2026-10-28T12:00:00Z');

      const expectedRecord = {
        id: 'att-1',
        messageId: 'msg-1',
        typeId: 'type-img',
        fileName: 'hello.png',
        mimeType: 'image/png',
        fileSize: 11,
        url: null,
        thumbnailUrl: null,
        createdAt: now,
        type: { title: 'IMAGE' },
      };

      mockPrisma.messageAttachment.create.mockResolvedValueOnce(expectedRecord);

      const result = await repository.create({
        messageId: 'msg-1',
        typeId: 'type-img',
        fileName: 'hello.png',
        mimeType: 'image/png',
        fileSize: 11,
        fileData: buffer,
      });

      expect(mockPrisma.messageAttachment.create).toHaveBeenCalledWith({
        data: {
          id: undefined,
          messageId: 'msg-1',
          typeId: 'type-img',
          fileName: 'hello.png',
          mimeType: 'image/png',
          fileSize: 11,
          fileData: new Uint8Array(buffer),
          url: undefined,
        },
        select: expect.objectContaining({
          id: true,
          fileName: true,
          fileSize: true,
          mimeType: true,
        }),
      });
      expect(result).toEqual(expectedRecord);
    });
  });

  describe('findById', () => {
    it('queries messageAttachment by id with metadata select excluding fileData', async () => {
      const record = {
        id: 'att-1',
        messageId: 'msg-1',
        typeId: 'type-1',
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 200,
        url: null,
        thumbnailUrl: null,
        createdAt: new Date(),
        type: { title: 'PDF' },
      };

      mockPrisma.messageAttachment.findUnique.mockResolvedValueOnce(record);

      const result = await repository.findById('att-1');

      expect(mockPrisma.messageAttachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'att-1' },
        select: expect.objectContaining({
          id: true,
          fileName: true,
          fileSize: true,
        }),
      });
      expect(result).toEqual(record);
    });
  });

  describe('findDownloadById', () => {
    it('queries messageAttachment selecting fileData and conversationId for verification', async () => {
      const downloadRecord = {
        id: 'att-1',
        fileName: 'file.pdf',
        mimeType: 'application/pdf',
        fileSize: 500,
        fileData: new Uint8Array([1, 2, 3]),
        message: {
          conversationId: 'conv-10',
        },
      };

      mockPrisma.messageAttachment.findUnique.mockResolvedValueOnce(downloadRecord);

      const result = await repository.findDownloadById('att-1');

      expect(mockPrisma.messageAttachment.findUnique).toHaveBeenCalledWith({
        where: { id: 'att-1' },
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
      expect(result).toEqual(downloadRecord);
    });
  });

  describe('findAttachmentTypeByTitle', () => {
    it('queries attachmentType catalog by title', async () => {
      mockPrisma.attachmentType.findFirst.mockResolvedValueOnce({
        id: 'type-pdf-id',
        title: 'PDF',
      });

      const result = await repository.findAttachmentTypeByTitle('PDF');

      expect(mockPrisma.attachmentType.findFirst).toHaveBeenCalledWith({
        where: { title: 'PDF' },
        select: { id: true, title: true },
      });
      expect(result).toEqual({ id: 'type-pdf-id', title: 'PDF' });
    });
  });
});
