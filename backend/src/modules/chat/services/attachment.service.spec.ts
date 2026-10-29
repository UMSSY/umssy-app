import { describe, expect, it, vi } from 'vitest';
import { AttachmentService } from './attachment.service.js';
import type { AttachmentRepository } from '../repositories/attachment.repository.js';
import type { AttachmentMapper } from '../mappers/attachment.mapper.js';
import type { ConversationRepository } from '../repositories/conversation.repository.js';
import type { ConversationParticipantRepository } from '../repositories/conversation-participant.repository.js';
import type { MessageRepository } from '../repositories/message.repository.js';
import type { MessageStatusService } from './message-status.service.js';
import type { BlockService } from './block.service.js';
import type { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { EmptyFileException } from '../../../common/exceptions/empty-file.exception.js';
import {
  AttachmentNotFoundException,
  AttachmentTooLargeException,
  InvalidAttachmentTypeException,
  ConversationNotFoundException,
  NotConversationParticipantException,
  UserBlockedException,
} from '../exceptions/index.js';

describe('AttachmentService', () => {
  const createMockService = () => {
    const attachmentRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findDownloadById: vi.fn(),
      findAttachmentTypeByTitle: vi.fn(),
    } as unknown as AttachmentRepository;

    const attachmentMapper = {
      toUploadedFile: vi.fn().mockImplementation((file: MulterFile) => ({
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        buffer: file.buffer,
      })),
      toResponse: vi.fn().mockImplementation((rec: any) => ({
        id: rec.id,
        messageId: rec.messageId,
        fileName: rec.fileName,
        mimeType: rec.mimeType,
        fileSize: rec.fileSize,
        url: rec.url ?? `/api/chat/attachments/${rec.id}/download`,
        thumbnailUrl: rec.thumbnailUrl ?? null,
        type: rec.type?.title ?? 'FILE',
        createdAt: rec.createdAt instanceof Date ? rec.createdAt.toISOString() : String(rec.createdAt),
      })),
    } as unknown as AttachmentMapper;

    const conversationRepository = {
      findById: vi.fn(),
      touchLastMessage: vi.fn(),
    } as unknown as ConversationRepository;

    const participantRepository = {
      findByConversationAndUser: vi.fn(),
      markRead: vi.fn(),
    } as unknown as ConversationParticipantRepository;

    const messageRepository = {
      create: vi.fn(),
    } as unknown as MessageRepository;

    const messageStatusService = {
      getSentId: vi.fn().mockResolvedValue('sent-status-id'),
    } as unknown as MessageStatusService;

    const fileValidationService = {
      detectMimeType: vi.fn(),
      validate: vi.fn(),
    } as unknown as FileValidationService;

    const blockService = {
      isBlockedBetween: vi.fn().mockResolvedValue(false),
    } as unknown as BlockService;

    const service = new AttachmentService(
      attachmentRepository,
      attachmentMapper,
      conversationRepository,
      participantRepository,
      messageRepository,
      messageStatusService,
      fileValidationService,
      blockService,
    );

    return {
      service,
      attachmentRepository: attachmentRepository as unknown as {
        create: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
        findDownloadById: ReturnType<typeof vi.fn>;
        findAttachmentTypeByTitle: ReturnType<typeof vi.fn>;
      },
      attachmentMapper: attachmentMapper as unknown as {
        toUploadedFile: ReturnType<typeof vi.fn>;
        toResponse: ReturnType<typeof vi.fn>;
      },
      conversationRepository: conversationRepository as unknown as {
        findById: ReturnType<typeof vi.fn>;
        touchLastMessage: ReturnType<typeof vi.fn>;
      },
      participantRepository: participantRepository as unknown as {
        findByConversationAndUser: ReturnType<typeof vi.fn>;
        markRead: ReturnType<typeof vi.fn>;
      },
      messageRepository: messageRepository as unknown as {
        create: ReturnType<typeof vi.fn>;
      },
      messageStatusService: messageStatusService as unknown as {
        getSentId: ReturnType<typeof vi.fn>;
      },
      fileValidationService: fileValidationService as unknown as {
        detectMimeType: ReturnType<typeof vi.fn>;
        validate: ReturnType<typeof vi.fn>;
      },
      blockService: blockService as unknown as {
        isBlockedBetween: ReturnType<typeof vi.fn>;
      },
    };
  };

  describe('uploadAndSend', () => {
    it('throws UserBlockedException (403) if there is an active block and does not create the message', async () => {
      const {
        service,
        fileValidationService,
        conversationRepository,
        participantRepository,
        messageRepository,
        blockService,
      } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue('image/png');
      fileValidationService.validate.mockReturnValue({
        originalName: 'photo.png',
        detectedMimeType: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      });
      conversationRepository.findById.mockResolvedValue({
        id: 'conv-1',
        userAId: 'user-1',
        userBId: 'user-2',
      });
      participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      blockService.isBlockedBetween.mockResolvedValue(true);

      const file = {
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      } as MulterFile;

      await expect(
      service.uploadAndSend('user-1', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(UserBlockedException);

      expect(blockService.isBlockedBetween).toHaveBeenCalledWith('user-1', 'user-2');
      expect(messageRepository.create).not.toHaveBeenCalled();
    });

    it('throws EmptyFileException if file is undefined or empty', async () => {
      const { service } = createMockService();

      await expect(
        service.uploadAndSend('user-1', undefined, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(EmptyFileException);

      await expect(
        service.uploadAndSend(
          'user-1',
          { buffer: Buffer.alloc(0), size: 0 } as MulterFile,
          { conversationId: 'conv-1', content: '' },
        ),
      ).rejects.toThrow(EmptyFileException);
    });

    it('throws InvalidAttachmentTypeException if detected mime and file mime are unsupported', async () => {
      const { service, fileValidationService } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue(null);

      const file = {
        originalname: 'script.sh',
        mimetype: 'application/x-sh',
        size: 100,
        buffer: Buffer.from('#!/bin/sh'),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-1', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(InvalidAttachmentTypeException);
    });

    it('throws AttachmentTooLargeException if image exceeds 5 MB', async () => {
      const { service, fileValidationService } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue('image/png');

      const file = {
        originalname: 'large.png',
        mimetype: 'image/png',
        size: 5 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-1', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(AttachmentTooLargeException);
    });

    it('throws AttachmentTooLargeException if PDF exceeds 10 MB', async () => {
      const { service, fileValidationService } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue('application/pdf');

      const file = {
        originalname: 'large.pdf',
        mimetype: 'application/pdf',
        size: 10 * 1024 * 1024 + 1,
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-1', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(AttachmentTooLargeException);
    });

    it('throws ConversationNotFoundException if conversation does not exist', async () => {
      const { service, fileValidationService, conversationRepository } =
        createMockService();
      fileValidationService.detectMimeType.mockReturnValue('image/png');
      fileValidationService.validate.mockReturnValue({
        originalName: 'photo.png',
        detectedMimeType: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      });
      conversationRepository.findById.mockResolvedValue(null);

      const file = {
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-1', file, { conversationId: 'conv-none', content: '' }),
      ).rejects.toThrow(ConversationNotFoundException);
    });

    it('throws NotConversationParticipantException if user is not in the conversation', async () => {
      const {
        service,
        fileValidationService,
        conversationRepository,
        participantRepository,
      } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue('image/jpeg');
      fileValidationService.validate.mockReturnValue({
        originalName: 'photo.jpg',
        detectedMimeType: 'image/jpeg',
        size: 1024,
        buffer: Buffer.alloc(1024),
      });
      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue(null);

      const file = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.alloc(1024),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-intruder', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(NotConversationParticipantException);
    });

    it('throws InvalidAttachmentTypeException if attachment type catalog is missing', async () => {
      const {
        service,
        fileValidationService,
        conversationRepository,
        participantRepository,
        attachmentRepository,
      } = createMockService();
      fileValidationService.detectMimeType.mockReturnValue('image/png');
      fileValidationService.validate.mockReturnValue({
        originalName: 'photo.png',
        detectedMimeType: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      });
      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      attachmentRepository.findAttachmentTypeByTitle.mockResolvedValue(null);

      const file = {
        originalname: 'photo.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.alloc(1024),
      } as MulterFile;

      await expect(
        service.uploadAndSend('user-1', file, { conversationId: 'conv-1', content: '' }),
      ).rejects.toThrow(InvalidAttachmentTypeException);
    });

    it('successfully uploads an image, creates message + attachment, and updates conversation state', async () => {
      const {
        service,
        fileValidationService,
        conversationRepository,
        participantRepository,
        attachmentRepository,
        messageRepository,
      } = createMockService();

      const imageBuffer = Buffer.from('fake-png-content');
      fileValidationService.detectMimeType.mockReturnValue('image/png');
      fileValidationService.validate.mockReturnValue({
        originalName: 'test.png',
        detectedMimeType: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer,
      });

      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      attachmentRepository.findAttachmentTypeByTitle.mockResolvedValue({
        id: 'type-img-id',
        title: 'IMAGE',
      });

      const now = new Date('2026-10-28T12:00:00Z');
      messageRepository.create.mockResolvedValue({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Check this image',
        sentAt: now,
        createdAt: now,
      });

      attachmentRepository.create.mockResolvedValue({
        id: 'att-1',
        messageId: 'msg-1',
        typeId: 'type-img-id',
        fileName: 'test.png',
        mimeType: 'image/png',
        fileSize: imageBuffer.length,
        url: null,
        thumbnailUrl: null,
        createdAt: now,
        type: { title: 'IMAGE' },
      });

      const file = {
        originalname: 'test.png',
        mimetype: 'image/png',
        size: imageBuffer.length,
        buffer: imageBuffer,
      } as MulterFile;

      const result = await service.uploadAndSend('user-1', file, {
        conversationId: 'conv-1',
        content: 'Check this image',
      });

      expect(fileValidationService.validate).toHaveBeenCalledWith(
        expect.anything(),
        { allowedTypes: ['jpg', 'png'], maxSizeBytes: 5 * 1024 * 1024 },
      );
      expect(attachmentRepository.create).toHaveBeenCalledWith({
        messageId: 'msg-1',
        typeId: 'type-img-id',
        fileName: 'test.png',
        mimeType: 'image/png',
        fileSize: imageBuffer.length,
        fileData: imageBuffer,
      });
      expect(conversationRepository.touchLastMessage).toHaveBeenCalledWith(
        'conv-1',
        'msg-1',
        expect.any(Date),
      );
      expect(participantRepository.markRead).toHaveBeenCalledWith(
        'conv-1',
        'user-1',
        expect.any(Date),
      );
      expect(result).toMatchObject({
        id: 'msg-1',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: 'Check this image',
        isAttachment: true,
        attachmentType: 'image',
        attachment: {
          id: 'att-1',
          fileName: 'test.png',
          mimeType: 'image/png',
          type: 'IMAGE',
        },
      });
    });

    it('successfully uploads a PDF document with attachmentType file', async () => {
      const {
        service,
        fileValidationService,
        conversationRepository,
        participantRepository,
        attachmentRepository,
        messageRepository,
      } = createMockService();

      const pdfBuffer = Buffer.from('%PDF-1.4 sample content');
      fileValidationService.detectMimeType.mockReturnValue('application/pdf');
      fileValidationService.validate.mockReturnValue({
        originalName: 'document.pdf',
        detectedMimeType: 'application/pdf',
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      });

      conversationRepository.findById.mockResolvedValue({ id: 'conv-1' });
      participantRepository.findByConversationAndUser.mockResolvedValue({ id: 'part-1' });
      attachmentRepository.findAttachmentTypeByTitle.mockResolvedValue({
        id: 'type-pdf-id',
        title: 'PDF',
      });

      const now = new Date('2026-10-28T12:00:00Z');
      messageRepository.create.mockResolvedValue({
        id: 'msg-2',
        conversationId: 'conv-1',
        senderId: 'user-1',
        content: '',
        sentAt: now,
        createdAt: now,
      });

      attachmentRepository.create.mockResolvedValue({
        id: 'att-2',
        messageId: 'msg-2',
        typeId: 'type-pdf-id',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: pdfBuffer.length,
        url: null,
        thumbnailUrl: null,
        createdAt: now,
        type: { title: 'PDF' },
      });

      const file = {
        originalname: 'document.pdf',
        mimetype: 'application/pdf',
        size: pdfBuffer.length,
        buffer: pdfBuffer,
      } as MulterFile;

      const result = await service.uploadAndSend('user-1', file, {
        conversationId: 'conv-1',
        content: '',
      });

      expect(fileValidationService.validate).toHaveBeenCalledWith(
        expect.anything(),
        { allowedTypes: ['pdf'], maxSizeBytes: 10 * 1024 * 1024 },
      );
      expect(messageRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ content: null }),
      );
      expect(result.attachmentType).toBe('file');
      expect(result.isAttachment).toBe(true);
      expect(result.attachment.type).toBe('PDF');
    });
  });

  describe('getDownload', () => {
    it('throws AttachmentNotFoundException if attachment record or fileData is missing', async () => {
      const { service, attachmentRepository } = createMockService();
      attachmentRepository.findDownloadById.mockResolvedValue(null);

      await expect(service.getDownload('user-1', 'att-none')).rejects.toThrow(
        AttachmentNotFoundException,
      );

      attachmentRepository.findDownloadById.mockResolvedValue({
        id: 'att-1',
        fileData: null,
      });
      await expect(service.getDownload('user-1', 'att-1')).rejects.toThrow(
        AttachmentNotFoundException,
      );
    });

    it('throws NotConversationParticipantException if user is not in the conversation', async () => {
      const { service, attachmentRepository, participantRepository } =
        createMockService();

      attachmentRepository.findDownloadById.mockResolvedValue({
        id: 'att-1',
        fileData: new Uint8Array([1, 2, 3]),
        fileName: 'doc.pdf',
        mimeType: 'application/pdf',
        fileSize: 3,
        message: {
          conversationId: 'conv-secret',
        },
      });
      participantRepository.findByConversationAndUser.mockResolvedValue(null);

      await expect(
        service.getDownload('user-intruder', 'att-1'),
      ).rejects.toThrow(NotConversationParticipantException);
      expect(participantRepository.findByConversationAndUser).toHaveBeenCalledWith(
        'conv-secret',
        'user-intruder',
      );
    });

    it('returns downloadable file details with binary Buffer when authorized', async () => {
      const { service, attachmentRepository, participantRepository } =
        createMockService();

      const binaryData = new Uint8Array([10, 20, 30, 40]);
      attachmentRepository.findDownloadById.mockResolvedValue({
        id: 'att-1',
        fileData: binaryData,
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        fileSize: 4,
        message: {
          conversationId: 'conv-1',
        },
      });
      participantRepository.findByConversationAndUser.mockResolvedValue({
        id: 'part-1',
      });

      const download = await service.getDownload('user-1', 'att-1');

      expect(download).toEqual({
        fileName: 'contract.pdf',
        mimeType: 'application/pdf',
        fileSize: 4,
        content: Buffer.from(binaryData),
      });
    });
  });

  describe('getById', () => {
    it('throws AttachmentNotFoundException if record is not found', async () => {
      const { service, attachmentRepository } = createMockService();
      attachmentRepository.findById.mockResolvedValue(null);

      await expect(service.getById('user-1', 'att-none')).rejects.toThrow(
        AttachmentNotFoundException,
      );
    });

    it('returns mapped attachment response when record is found', async () => {
      const { service, attachmentRepository } = createMockService();
      const now = new Date('2026-10-28T12:00:00Z');

      attachmentRepository.findById.mockResolvedValue({
        id: 'att-1',
        messageId: 'msg-1',
        typeId: 'type-img',
        fileName: 'pic.png',
        mimeType: 'image/png',
        fileSize: 100,
        url: null,
        thumbnailUrl: null,
        createdAt: now,
        type: { title: 'IMAGE' },
      });

      const result = await service.getById('user-1', 'att-1');
      expect(result.id).toBe('att-1');
      expect(result.fileName).toBe('pic.png');
      expect(result.url).toBe('/api/chat/attachments/att-1/download');
    });
  });
});