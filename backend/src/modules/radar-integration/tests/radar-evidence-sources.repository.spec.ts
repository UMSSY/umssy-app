import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { RadarEvidenceSourcesRepository } from '../repositories/radar-evidence-sources.repository.js';

function build(current: unknown) {
  const findFirst = vi.fn().mockResolvedValue(current);
  const repository = new RadarEvidenceSourcesRepository({
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
