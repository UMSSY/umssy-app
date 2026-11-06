import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CvFileRepository } from '../repositories/cv-file.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';
const content = Buffer.from([0x25, 0x50, 0x44, 0x46]);

describe('CvFileRepository', () => {
  let repository: CvFileRepository;
  let userCvFile: {
    create: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    userCvFile = {
      create: vi.fn(),
      findFirst: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    };
    repository = new CvFileRepository({ userCvFile } as unknown as PrismaService);
  });

  describe('create', () => {
    it('creates a new cv row as base64 and returns its id', async () => {
      userCvFile.create.mockResolvedValue({ id: cvId });
      const before = Date.now();

      await expect(repository.create(userId, content, 'resume.pdf')).resolves.toBe(cvId);

      const [args] = userCvFile.create.mock.calls[0] as [
        {
          data: { userId: string; cvFileName: string; cvPdfData: string; cvUploadedAt: Date };
          select: object;
        },
      ];
      expect(args.select).toEqual({ id: true });
      expect(args.data).toMatchObject({
        userId,
        cvFileName: 'resume.pdf',
        cvPdfData: content.toString('base64'),
      });
      expect(args.data.cvUploadedAt.getTime()).toBeGreaterThanOrEqual(before);
    });

    it('never overwrites a previous cv of the user', async () => {
      userCvFile.create.mockResolvedValue({ id: cvId });

      await repository.create(userId, content, 'resume.pdf');

      expect(userCvFile.update).not.toHaveBeenCalled();
      expect(userCvFile.findFirst).not.toHaveBeenCalled();
    });

    it('stores a null file name when none is given', async () => {
      userCvFile.create.mockResolvedValue({ id: cvId });

      await repository.create(userId, content);

      const [args] = userCvFile.create.mock.calls[0] as [{ data: { cvFileName: null } }];
      expect(args.data.cvFileName).toBeNull();
    });
  });

  describe('readById', () => {
    it('reads only the pdf column of a cv owned by the user', async () => {
      userCvFile.findFirst.mockResolvedValue({ cvPdfData: content.toString('base64') });

      const result = await repository.readById(userId, cvId);

      expect(userCvFile.findFirst).toHaveBeenCalledWith({
        where: { id: cvId, userId },
        select: { cvPdfData: true },
      });
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result).toEqual(content);
    });

    it('returns null when the cv has no data', async () => {
      userCvFile.findFirst.mockResolvedValue({ cvPdfData: null });

      await expect(repository.readById(userId, cvId)).resolves.toBeNull();
    });

    it('returns null when the cv does not exist or belongs to another user', async () => {
      userCvFile.findFirst.mockResolvedValue(null);

      await expect(repository.readById(userId, cvId)).resolves.toBeNull();
    });
  });

  describe('removeById', () => {
    it('removes the cv scoped to its owner', async () => {
      userCvFile.deleteMany.mockResolvedValue({ count: 1 });

      await expect(repository.removeById(userId, cvId)).resolves.toBe(true);
      expect(userCvFile.deleteMany).toHaveBeenCalledWith({ where: { id: cvId, userId } });
    });

    it('returns false when nothing was removed', async () => {
      userCvFile.deleteMany.mockResolvedValue({ count: 0 });

      await expect(repository.removeById(userId, cvId)).resolves.toBe(false);
    });
  });
});
