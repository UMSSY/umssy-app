import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CvNotFoundException } from '../exceptions/cv-not-found.exception.js';
import { EmptyFileException } from '../../../common/exceptions/empty-file.exception.js';
import { FileTooLargeException } from '../../../common/exceptions/file-too-large.exception.js';
import { InvalidFileTypeException } from '../../../common/exceptions/invalid-file-type.exception.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import { FileValidationService } from '../../../common/services/file-validation.service.js';
import type { MulterFile } from '../../../common/types/multer-file.type.js';
import { CvMapper } from '../mappers/cv.mapper.js';
import type { CvMetadataRepository } from '../repositories/cv-metadata.repository.js';
import { CvService } from '../services/cv.service.js';
import type { RadarIntegrationService } from '../../radar-integration/radar-integration.service.js';
import type { CvFileStorage } from '../types/cv-file-storage.type.js';
import type { CvMetadataRecord } from '../types/cv-metadata-record.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';
const olderCvId = '33333333-3333-4333-8333-333333333333';
const pdfContent = Buffer.from("%PDF-1.4\n" + " ".repeat(50) + "\n%%EOF\n");
const pngContent = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(50), Buffer.from([0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82])]);

const buildRecord = (
  overrides: Partial<CvMetadataRecord> = {},
): CvMetadataRecord => ({
  id: cvId,
  firstName: 'Test',
  lastName: 'User',
  fileName: 'resume.pdf',
  sizeBytes: pdfContent.length,
  uploadedAt: new Date('2026-10-03T12:00:00.000Z'),
  isCurrent: true,
  ...overrides,
});

const buildMulterFile = (
  buffer: Buffer,
  overrides: Partial<MulterFile> = {},
): MulterFile => ({
  originalname: 'resume.pdf',
  mimetype: 'application/pdf',
  size: buffer.length,
  buffer,
  ...overrides,
});

describe('CvService', () => {
  let service: CvService;
  let repository: {
    findByIdForUser: ReturnType<typeof vi.fn>;
    countByUserId: ReturnType<typeof vi.fn>;
    findPageByUserId: ReturnType<typeof vi.fn>;
  };
  let storage: {
    create: ReturnType<typeof vi.fn>;
    readById: ReturnType<typeof vi.fn>;
    removeById: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      findByIdForUser: vi.fn(),
      countByUserId: vi.fn(),
      findPageByUserId: vi.fn(),
    };
    storage = { create: vi.fn(), readById: vi.fn(), removeById: vi.fn() };
    service = new CvService(
      repository as unknown as CvMetadataRepository,
      storage as unknown as CvFileStorage,
      new FileValidationService(),
      new CvMapper(),
      { ingestCv: vi.fn().mockResolvedValue(undefined), cvRemoved: vi.fn().mockResolvedValue(undefined) } as unknown as RadarIntegrationService,
    );
  });

  describe('list', () => {
    it('returns the requested page with the totals', async () => {
      repository.countByUserId.mockResolvedValue(7);
      repository.findPageByUserId.mockResolvedValue([
        buildRecord(),
        buildRecord({ id: olderCvId, isCurrent: false }),
      ]);

      const result = await service.list(userId, { page: 1, limit: 5 });

      expect(repository.findPageByUserId).toHaveBeenCalledWith(userId, 0, 5);
      expect(result).toMatchObject({ totalItems: 7, totalPages: 2, page: 1, limit: 5 });
      expect(result.items.map((item) => [item.id, item.isCurrent])).toEqual([
        [cvId, true],
        [olderCvId, false],
      ]);
    });

    it('computes the offset of later pages', async () => {
      repository.countByUserId.mockResolvedValue(12);
      repository.findPageByUserId.mockResolvedValue([]);

      await service.list(userId, { page: 3, limit: 5 });

      expect(repository.findPageByUserId).toHaveBeenCalledWith(userId, 10, 5);
    });

    it('returns an empty page without querying when the user has no cvs', async () => {
      repository.countByUserId.mockResolvedValue(0);

      await expect(service.list(userId, { page: 1, limit: 5 })).resolves.toEqual({
        items: [],
        totalItems: 0,
        totalPages: 0,
        page: 1,
        limit: 5,
      });
      expect(repository.findPageByUserId).not.toHaveBeenCalled();
    });

    it('returns an empty page when the page is beyond the last one', async () => {
      repository.countByUserId.mockResolvedValue(3);

      const result = await service.list(userId, { page: 2, limit: 5 });

      expect(result.items).toEqual([]);
      expect(repository.findPageByUserId).not.toHaveBeenCalled();
    });

    it('throws profile not found when the user does not exist', async () => {
      repository.countByUserId.mockResolvedValue(null);

      await expect(service.list(userId, { page: 1, limit: 5 })).rejects.toBeInstanceOf(
        ProfileNotFoundException,
      );
    });
  });

  describe('getFileById', () => {
    it('returns the requested pdf of the user', async () => {
      repository.findByIdForUser.mockResolvedValue(
        buildRecord({ id: olderCvId, fileName: 'old.pdf', isCurrent: false }),
      );
      storage.readById.mockResolvedValue(pdfContent);

      await expect(service.getFileById(userId, olderCvId)).resolves.toEqual({
        content: pdfContent,
        fileName: 'old.pdf',
        mimeType: 'application/pdf',
      });
      expect(repository.findByIdForUser).toHaveBeenCalledWith(userId, olderCvId);
      expect(storage.readById).toHaveBeenCalledWith(userId, olderCvId);
    });

    it('throws cv not found when the cv belongs to another user', async () => {
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.getFileById(userId, cvId)).rejects.toBeInstanceOf(
        CvNotFoundException,
      );
      expect(storage.readById).not.toHaveBeenCalled();
    });

    it('throws cv not found when the content disappeared', async () => {
      repository.findByIdForUser.mockResolvedValue(buildRecord());
      storage.readById.mockResolvedValue(null);

      await expect(service.getFileById(userId, cvId)).rejects.toBeInstanceOf(
        CvNotFoundException,
      );
    });
  });

  describe('upload', () => {
    it('creates a new cv and returns it as the current one', async () => {
      repository.countByUserId.mockResolvedValue(1);
      storage.create.mockResolvedValue(cvId);
      repository.findByIdForUser.mockResolvedValue(buildRecord());

      const result = await service.upload(userId, buildMulterFile(pdfContent));

      expect(storage.create).toHaveBeenCalledWith(userId, pdfContent, 'resume.pdf');
      expect(repository.findByIdForUser).toHaveBeenCalledWith(userId, cvId);
      expect(result).toMatchObject({ id: cvId, isCurrent: true, fileName: 'resume.pdf' });
    });

    it('returns null when the created cv cannot be read back', async () => {
      repository.countByUserId.mockResolvedValue(0);
      storage.create.mockResolvedValue(cvId);
      repository.findByIdForUser.mockResolvedValue(null);

      await expect(service.upload(userId, buildMulterFile(pdfContent))).resolves.toBeNull();
    });

    it('rejects a missing file without saving', async () => {
      repository.countByUserId.mockResolvedValue(0);

      await expect(service.upload(userId, undefined)).rejects.toBeInstanceOf(
        EmptyFileException,
      );
      expect(storage.create).not.toHaveBeenCalled();
    });

    it('rejects a png renamed as pdf without saving', async () => {
      repository.countByUserId.mockResolvedValue(0);

      await expect(
        service.upload(userId, buildMulterFile(pngContent)),
      ).rejects.toBeInstanceOf(InvalidFileTypeException);
      expect(storage.create).not.toHaveBeenCalled();
    });

    it('rejects a pdf larger than 5 MB without saving', async () => {
      repository.countByUserId.mockResolvedValue(0);
      const file = buildMulterFile(pdfContent, { size: 5 * 1024 * 1024 + 1 });

      await expect(service.upload(userId, file)).rejects.toBeInstanceOf(
        FileTooLargeException,
      );
      expect(storage.create).not.toHaveBeenCalled();
    });

    it('throws profile not found without validating or saving', async () => {
      repository.countByUserId.mockResolvedValue(null);

      await expect(
        service.upload(userId, buildMulterFile(pdfContent)),
      ).rejects.toBeInstanceOf(ProfileNotFoundException);
      expect(storage.create).not.toHaveBeenCalled();
    });
  });

  describe('removeById', () => {
    it('removes the requested cv of the user', async () => {
      storage.removeById.mockResolvedValue(true);

      await expect(service.removeById(userId, olderCvId)).resolves.toBeUndefined();
      expect(storage.removeById).toHaveBeenCalledWith(userId, olderCvId);
    });

    it('throws cv not found when the cv does not exist or belongs to another user', async () => {
      storage.removeById.mockResolvedValue(false);

      await expect(service.removeById(userId, cvId)).rejects.toBeInstanceOf(
        CvNotFoundException,
      );
    });
  });
});
