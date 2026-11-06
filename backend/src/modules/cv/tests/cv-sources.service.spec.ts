import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { CvFileRepository } from '../repositories/cv-file.repository.js';
import { CvSourcesService } from '../services/cv-sources.service.js';

it('returns the stored CV or null through the owning repository', async () => {
  const record = { id: 'cv', userId: 'owner', cvPdfData: 'cGRm', cvFileName: 'CV.pdf' };
  const repository = { currentCv: vi.fn().mockResolvedValue(record), cvById: vi.fn().mockResolvedValue(null) };
  const service = new CvSourcesService(repository as unknown as CvFileRepository);
  expect(await service.currentCv('owner')).toBe(record);
  expect(repository.currentCv).toHaveBeenCalledWith('owner');
  expect(await service.cvById('missing')).toBeNull();
  expect(repository.cvById).toHaveBeenCalledWith('missing');
});

describe('CV source projections', () => {
  it('scopes the current CV by owner and selects the newest upload', async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    const repository = new CvFileRepository({ userCvFile: { findFirst } } as unknown as PrismaService);
    expect(await repository.currentCv('owner')).toBeNull();
    expect(findFirst).toHaveBeenCalledWith({ where: { userId: 'owner' }, orderBy: { cvUploadedAt: 'desc' }, select: { id: true, cvPdfData: true } });
  });

  it('selects the stored owner, content and filename for a specific CV', async () => {
    const findUnique = vi.fn().mockResolvedValue(null);
    const repository = new CvFileRepository({ userCvFile: { findUnique } } as unknown as PrismaService);
    await repository.cvById('cv');
    expect(findUnique).toHaveBeenCalledWith({ where: { id: 'cv' }, select: { id: true, userId: true, cvPdfData: true, cvFileName: true } });
  });
});
