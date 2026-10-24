import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { Prisma } from '../../../prisma/client.js';
import { CvMetadataRepository } from '../repositories/cv-metadata.repository.js';
import type { CvMetadataRecord } from '../types/cv-metadata-record.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const cvId = '22222222-2222-4222-8222-222222222222';

const record: CvMetadataRecord = {
  id: cvId,
  firstName: 'Test',
  lastName: 'User',
  fileName: 'resume.pdf',
  sizeBytes: 1024,
  uploadedAt: new Date('2026-10-03T12:00:00.000Z'),
  isCurrent: true,
};

describe('CvMetadataRepository', () => {
  let repository: CvMetadataRepository;
  let queryRaw: ReturnType<typeof vi.fn>;

  const lastQuery = (): Prisma.Sql => queryRaw.mock.calls.at(-1)?.[0] as Prisma.Sql;

  const expectNoFileContent = (sql: string) => {
    expect(sql).not.toMatch(/\bc\.cv_pdf_data\b/);
    expect(sql).not.toContain('decode(');
    expect(sql).not.toContain('password');
  };

  beforeEach(() => {
    queryRaw = vi.fn();
    repository = new CvMetadataRepository({
      $queryRaw: queryRaw,
    } as unknown as PrismaService);
  });

  describe('findByIdForUser', () => {
    it('filters the cv by id and owner and flags whether it is current', async () => {
      queryRaw.mockResolvedValue([record]);

      await expect(repository.findByIdForUser(userId, cvId)).resolves.toEqual(record);

      const { text: sql, values } = lastQuery();
      expect(values).toEqual([cvId, userId]);
      expect(sql).toContain('c.user_id = $2::uuid');
      expect(sql).toContain('"isCurrent"');
      expectNoFileContent(sql);
    });

    it('returns null when the cv does not belong to the user', async () => {
      queryRaw.mockResolvedValue([]);

      await expect(repository.findByIdForUser(userId, cvId)).resolves.toBeNull();
    });
  });

  describe('countByUserId', () => {
    it('counts the visible cvs of the user as an integer', async () => {
      queryRaw.mockResolvedValue([{ total: 7 }]);

      await expect(repository.countByUserId(userId)).resolves.toBe(7);

      const { text: sql, values } = lastQuery();
      expect(values).toEqual([userId]);
      expect(sql).toContain('count(c.id)::int');
      expect(sql).toContain('cv_pdf_data IS NOT NULL AND cv_uploaded_at IS NOT NULL');
    });

    it('returns null when the user does not exist', async () => {
      queryRaw.mockResolvedValue([]);

      await expect(repository.countByUserId(userId)).resolves.toBeNull();
    });
  });

  describe('findPageByUserId', () => {
    it('pages the cvs newest first and marks the newest as current', async () => {
      queryRaw.mockResolvedValue([record]);

      await expect(repository.findPageByUserId(userId, 10, 5)).resolves.toEqual([record]);

      const { text: sql, values } = lastQuery();
      expect(values).toEqual([userId, 5, 10]);
      expect(sql).toContain('ORDER BY c.cv_uploaded_at DESC, c.id DESC');
      expect(sql).toContain('row_number() OVER');
      expect(sql).toMatch(/LIMIT \$2 OFFSET \$3/);
      expectNoFileContent(sql);
    });
  });
});
