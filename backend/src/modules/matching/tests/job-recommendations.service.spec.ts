import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import type { JobOfferResponse } from '../../job-offers/responses/job-offer.response.js';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';

function offer(id: string, skills: string[]): JobOfferResponse {
  return {
    id,
    title: id,
    company: { id: 'company', name: 'Empresa' },
    modality: 'Remoto',
    description: 'Descripción',
    category: 'Tecnología',
    contractType: 'Tiempo completo',
    status: 'Publicada',
    positionsAvailable: 1,
    salaryRange: '',
    languages: '',
    locationUrl: '',
    expiresAt: null,
    createdAt: '2026-10-23T00:00:00.000Z',
    skills: skills.map((name) => ({ id: name, name })),
  };
}

describe('HU-06 recommendations contract', () => {
  const findUnique = vi.fn();
  const listPublished = vi.fn();
  let service: JobRecommendationsService;

  beforeEach(() => {
    findUnique
      .mockReset()
      .mockResolvedValue({ userSkills: [{ skill: { name: 'Python' } }] });
    listPublished
      .mockReset()
      .mockResolvedValue([
        offer('partial', ['Python', 'SQL']),
        offer('none', ['Java']),
        offer('perfect', ['python']),
        offer('unrestricted', []),
      ]);
    service = new JobRecommendationsService(
      { user: { findUnique } } as unknown as PrismaService,
      { listPublished } as unknown as JobOffersService,
      new VacancyRankingService(),
      new WeightedScoreService(),
    );
  });

  it('orders by affinity and keeps matching skill count as tie breaker', async () => {
    const result = await service.recommendations('user');
    expect(result.items.map((item) => [item.jobOfferId, item.score])).toEqual([
      ['perfect', 100],
      ['unrestricted', 100],
      ['partial', 50],
      ['none', 0],
    ]);
    expect(findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'user' } }),
    );
  });

  it('recalculates on every request after profile skills change', async () => {
    const scoreOf = async () =>
      (await service.recommendations('user')).items.find(
        (item) => item.jobOfferId === 'partial',
      )?.score;
    expect(await scoreOf()).toBe(50);
    findUnique.mockResolvedValue({
      userSkills: ['Python', 'SQL'].map((name) => ({ skill: { name } })),
    });
    expect(await scoreOf()).toBe(100);
  });

  it.each([null, { userSkills: [] }])(
    'returns an incomplete profile without listing offers: %j',
    async (user) => {
      findUnique.mockResolvedValue(user);
      await expect(service.recommendations('user')).resolves.toEqual({
        isProfileComplete: false,
        items: [],
      });
      expect(listPublished).not.toHaveBeenCalled();
    },
  );

  it('returns an empty feed when there are no published offers', async () => {
    listPublished.mockResolvedValue([]);
    await expect(service.recommendations('user')).resolves.toEqual({
      isProfileComplete: true,
      items: [],
    });
  });

  it('propagates connection failures so the UI can offer retry', async () => {
    findUnique.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.recommendations('user')).rejects.toThrow(
      'Database unavailable',
    );
  });
});
