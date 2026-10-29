import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { StreamableFile } from '@nestjs/common';
import { AttachmentController } from '../controllers/attachment.controller.js';
import { AttachmentService } from '../services/attachment.service.js';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard.js';
import { RolesGuard } from '../../../common/guards/roles.guard.js';
import { ROLES_KEY } from '../../../common/constants/roles.constants.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';

describe('AttachmentController', () => {
  let controller: AttachmentController;
  let service: AttachmentService;

  const mockService = {
    uploadAndSend: vi.fn(),
    getDownload: vi.fn(),
    getById: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AttachmentController],
      providers: [
        {
          provide: AttachmentService,
          useValue: mockService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<AttachmentController>(AttachmentController);
    service = module.get<AttachmentService>(AttachmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
  });

  it('should require chat roles (titulado, estudiante, mentor, empresa)', () => {
    const roles = new Reflector().get<string[]>(ROLES_KEY, AttachmentController);
    expect(roles).toEqual(['titulado', 'estudiante', 'mentor', 'empresa']);
  });

  it('uploadAndSend should delegate to attachmentService.uploadAndSend', async () => {
    const file = {
      originalname: 'document.pdf',
      mimetype: 'application/pdf',
      size: 1024,
      buffer: Buffer.from('%PDF-1.4'),
    } as MulterFile;

    const dto = {
      conversationId: '11111111-1111-1111-1111-111111111111',
      content: 'Here is the syllabus',
    };

    const mockResponse = {
      id: 'msg-1',
      conversationId: dto.conversationId,
      senderId: 'user-1',
      content: dto.content,
      isAttachment: true,
      attachmentType: 'file' as const,
      status: 'sent' as const,
      timestamp: '2026-10-28T12:00:00.000Z',
      createdAt: '2026-10-28T12:00:00.000Z',
      attachment: {
        id: 'att-1',
        messageId: 'msg-1',
        fileName: 'document.pdf',
        mimeType: 'application/pdf',
        fileSize: 1024,
        url: '/api/chat/attachments/att-1/download',
        thumbnailUrl: null,
        type: 'PDF',
        createdAt: '2026-10-28T12:00:00.000Z',
      },
    };

    mockService.uploadAndSend.mockResolvedValueOnce(mockResponse);

    const result = await controller.uploadAndSend('user-1', file, dto);

    expect(mockService.uploadAndSend).toHaveBeenCalledWith('user-1', file, dto);
    expect(result).toEqual(mockResponse);
  });

  it('uploadAndSendAlias should delegate to attachmentService.uploadAndSend', async () => {
    const file = {
      originalname: 'image.png',
      mimetype: 'image/png',
      size: 2048,
      buffer: Buffer.from('fake-png'),
    } as MulterFile;

    const dto = {
      conversationId: '22222222-2222-2222-2222-222222222222',
      content: '',
    };

    const mockResponse = {
      id: 'msg-2',
      conversationId: dto.conversationId,
      senderId: 'user-2',
      content: '',
      isAttachment: true,
      attachmentType: 'image' as const,
      status: 'sent' as const,
      timestamp: '2026-10-28T12:00:00.000Z',
      createdAt: '2026-10-28T12:00:00.000Z',
      attachment: {
        id: 'att-2',
        messageId: 'msg-2',
        fileName: 'image.png',
        mimeType: 'image/png',
        fileSize: 2048,
        url: '/api/chat/attachments/att-2/download',
        thumbnailUrl: null,
        type: 'IMAGE',
        createdAt: '2026-10-28T12:00:00.000Z',
      },
    };

    mockService.uploadAndSend.mockResolvedValueOnce(mockResponse);

    const result = await controller.uploadAndSendAlias('user-2', file, dto);

    expect(mockService.uploadAndSend).toHaveBeenCalledWith('user-2', file, dto);
    expect(result).toEqual(mockResponse);
  });

  it('download should return StreamableFile with proper disposition and mime type', async () => {
    const fileBuffer = Buffer.from('Sample binary stream');
    mockService.getDownload.mockResolvedValueOnce({
      fileName: 'report.pdf',
      mimeType: 'application/pdf',
      fileSize: fileBuffer.length,
      content: fileBuffer,
    });

    const streamable = await controller.download(
      'user-1',
      '33333333-3333-3333-3333-333333333333',
    );

    expect(mockService.getDownload).toHaveBeenCalledWith(
      'user-1',
      '33333333-3333-3333-3333-333333333333',
    );
    expect(streamable).toBeInstanceOf(StreamableFile);
  });

  it('getById should return attachment metadata', async () => {
    const mockMeta = {
      id: 'att-1',
      messageId: 'msg-1',
      fileName: 'photo.jpg',
      mimeType: 'image/jpeg',
      fileSize: 5000,
      url: '/api/chat/attachments/att-1/download',
      thumbnailUrl: null,
      type: 'IMAGE',
      createdAt: '2026-10-28T12:00:00.000Z',
    };

    mockService.getById.mockResolvedValueOnce(mockMeta);

    const result = await controller.getById(
      'user-1',
      '44444444-4444-4444-4444-444444444444',
    );

    expect(mockService.getById).toHaveBeenCalledWith(
      'user-1',
      '44444444-4444-4444-4444-444444444444',
    );
    expect(result).toEqual(mockMeta);
  });
});
