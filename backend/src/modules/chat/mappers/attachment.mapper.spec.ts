import { describe, it, expect } from 'vitest';
import { AttachmentMapper } from './attachment.mapper.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import type { AttachmentRecord } from '../types/attachment.types.js';

describe('AttachmentMapper', () => {
  const mapper = new AttachmentMapper();

  describe('toUploadedFile', () => {
    it('maps MulterFile to UploadedFile structure', () => {
      const buffer = Buffer.from('test');
      const multerFile: MulterFile = {
        fieldname: 'file',
        originalname: 'test.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 4,
        buffer,
      };

      const result = mapper.toUploadedFile(multerFile);

      expect(result).toEqual({
        originalName: 'test.png',
        mimeType: 'image/png',
        size: 4,
        buffer,
      });
    });
  });

  describe('toResponse', () => {
    it('maps AttachmentRecord to AttachmentResponse with default download url when url is null', () => {
      const now = new Date('2026-10-28T10:00:00Z');
      const record: AttachmentRecord = {
        id: 'att-123',
        messageId: 'msg-456',
        typeId: 'type-789',
        fileName: 'guide.pdf',
        mimeType: 'application/pdf',
        fileSize: 10240,
        url: null,
        thumbnailUrl: null,
        createdAt: now,
        type: {
          title: 'PDF',
        },
      };

      const res = mapper.toResponse(record);

      expect(res).toEqual({
        id: 'att-123',
        messageId: 'msg-456',
        fileName: 'guide.pdf',
        mimeType: 'application/pdf',
        fileSize: 10240,
        url: '/api/chat/attachments/att-123/download',
        thumbnailUrl: null,
        type: 'PDF',
        createdAt: '2026-10-28T10:00:00.000Z',
      });
    });

    it('preserves existing url and falls back to FILE type when type relation is missing', () => {
      const record: AttachmentRecord = {
        id: 'att-999',
        messageId: 'msg-888',
        typeId: 'type-777',
        fileName: 'custom.bin',
        mimeType: 'application/octet-stream',
        fileSize: 50,
        url: 'https://cdn.example.com/file.bin',
        thumbnailUrl: 'https://cdn.example.com/thumb.bin',
        createdAt: new Date('2026-10-28T11:00:00Z'),
      };

      const res = mapper.toResponse(record);

      expect(res.url).toBe('https://cdn.example.com/file.bin');
      expect(res.thumbnailUrl).toBe('https://cdn.example.com/thumb.bin');
      expect(res.type).toBe('FILE');
    });
  });
});
