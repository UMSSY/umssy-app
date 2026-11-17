import { describe, expect, it, vi } from 'vitest';
import { CvFileRepository } from '../repositories/cv-file.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('Metadatos del CV vigente', () => {
  it('selecciona solo el ID y comparte el orden estable con la lectura de contenido', async () => {
    const findFirst = vi.fn().mockResolvedValue({ id: 'cv' });
    const repository = new CvFileRepository({
      userCvFile: { findFirst },
    } as unknown as PrismaService);
    await repository.currentCvMetadata('owner');
    expect(findFirst).toHaveBeenLastCalledWith({
      where: { userId: 'owner' },
      select: { id: true },
      orderBy: [
        { cvUploadedAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
        { id: 'desc' },
      ],
    });
    const metadataQuery = findFirst.mock.calls[0]?.[0];
    await repository.currentCv('owner');
    expect(findFirst).toHaveBeenLastCalledWith({
      ...metadataQuery,
      select: { id: true, cvPdfData: true },
    });
  });
});
