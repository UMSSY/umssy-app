import { describe, expect, it, vi } from 'vitest';
import { RadarEvidenceSourcesService } from '../services/radar-evidence-sources.service.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';
import { CvFileRepository } from '../../cv/repositories/cv-file.repository.js';
import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('current CV selection', () => {
  it('selects the current file even if its evidence is not yet ready, without falling back', async () => {
    const repo = { findCurrentCvText: vi.fn().mockResolvedValue([]) };
    const cvs = {
      currentCvReference: vi
        .fn()
        .mockResolvedValue({ id: 'new-cv', hasDocument: true }),
    };
    const service = new RadarEvidenceSourcesService(
      repo as unknown as RadarEvidenceSourcesRepository,
      cvs as unknown as CvSourcesService,
    );
    await expect(service.findCurrentCvText('owner')).resolves.toEqual([]);
    expect(repo.findCurrentCvText).toHaveBeenCalledExactlyOnceWith(
      'owner',
      'new-cv',
    );
  });
  it.each(['queued', 'reading', 'review', 'low_confidence', 'manual_rejected'])(
    'does not reuse an older approval when current verification is %s',
    async (status) => {
      const findFirst = vi
        .fn()
        .mockResolvedValue({
          cvId: 'current',
          extractedText: 'Docker',
          extractionState: { title: 'ready' },
          reviewState: { title: 'approved' },
        });
      const repository = new RadarEvidenceSourcesRepository({
        radarCvEvidence: { findFirst },
        $queryRaw: vi.fn().mockResolvedValue([{ status }]),
      } as unknown as PrismaService);
      await expect(
        repository.findCurrentCvText('owner', 'current'),
      ).resolves.toEqual([]);
      expect(findFirst).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: { userId: 'owner', cvId: 'current' },
        }),
      );
    },
  );
  it('orders file references by submission time and ID without a verification filter', async () => {
    const query = vi
      .fn()
      .mockResolvedValue([{ id: 'current', hasDocument: true }]);
    const repository = new CvFileRepository({
      $queryRaw: query,
    } as unknown as PrismaService);
    await expect(repository.currentCvReference('owner')).resolves.toEqual({
      id: 'current',
      hasDocument: true,
    });
    const sql = query.mock.calls[0][0].join('');
    expect(sql).toContain(
      'ORDER BY COALESCE(cv_uploaded_at,created_at) DESC,id DESC LIMIT 1',
    );
    expect(sql).not.toContain('status');
  });
});
