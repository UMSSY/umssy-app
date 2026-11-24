import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';

function build(current: unknown, status?: string) {
  const findFirst = vi.fn().mockResolvedValue(current);
  const repository = new RadarEvidenceSourcesRepository({
    radarDocumentVerification: {
      findFirst: vi
        .fn()
        .mockResolvedValue(status ? { statusEntry: { title: status } } : null),
    },
    radarCvEvidence: { findFirst },
  } as unknown as PrismaService);
  return { repository, findFirst };
}

const current = {
  cvId: 'current-cv',
  extractedText: 'Texto vigente',
  extractionState: { title: 'ready' },
  reviewState: { title: 'pending' },
};

describe('RadarEvidenceSourcesRepository', () => {
  it('returns the latest persisted radar scores for affinity', async () => {
    const findFirst = vi.fn().mockResolvedValue({ scores: { desarrollo: 6 } });
    const repository = new RadarEvidenceSourcesRepository({
      radarScoreSnapshot: { findFirst },
    } as unknown as PrismaService);

    await expect(repository.findLatestScores('user')).resolves.toEqual({
      desarrollo: 6,
    });
    expect(findFirst).toHaveBeenCalledExactlyOnceWith({
      where: { userId: 'user' },
      orderBy: { version: 'desc' },
      select: { scores: true },
    });
  });

  it.each([
    'queued',
    'reading',
    'review',
    'low_confidence',
    'manual_rejected',
    'cancelled',
  ])(
    'no recupera texto anterior si la verificación vigente es %s',
    async (status) => {
      const { repository, findFirst } = build(current, status);
      await expect(
        repository.findCurrentCvText('user', 'current-cv'),
      ).resolves.toEqual([]);
      expect(findFirst).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: { userId: 'user', cvId: 'current-cv' },
        }),
      );
    },
  );
  it.each(['approved', 'manual_approved', 'legacy'])(
    'usa el CV vigente con estado %s',
    async (status) => {
      const { repository } = build(current, status);
      await expect(
        repository.findCurrentCvText('user', 'current-cv'),
      ).resolves.toEqual([
        { id: 'current-cv', type: 'cv', text: 'Texto vigente' },
      ]);
    },
  );
  it('devuelve el texto del CV vigente listo para analizar', async () => {
    const { repository } = build(current);
    await expect(repository.findCurrentCvText('user')).resolves.toEqual([
      { id: 'current-cv', type: 'cv', text: 'Texto vigente' },
    ]);
  });

  it.each([
    { ...current, extractionState: { title: 'failed' } },
    { ...current, reviewState: { title: 'rejected' } },
    null,
  ])(
    'no reutiliza un CV anterior cuando el vigente no es válido',
    async (row) => {
      const { repository, findFirst } = build(row);
      await expect(repository.findCurrentCvText('user')).resolves.toEqual([]);
      expect(findFirst).toHaveBeenCalledOnce();
      expect(findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user' },
          orderBy: [{ submittedAt: 'desc' }, { cvId: 'desc' }],
        }),
      );
    },
  );
});
