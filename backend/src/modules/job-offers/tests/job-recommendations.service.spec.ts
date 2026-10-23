import { describe, expect, it, beforeEach, vi } from 'vitest';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import { JobOffersService } from '../services/job-offers.service.js';
import { MatchingService } from '../../matching/services/matching.service.js';
import { WeightedScoreService } from '../../matching/services/weighted-score.service.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';

describe('JobRecommendationsService', () => {
  let service: JobRecommendationsService;
  let jobOffersService: JobOffersService;
  let weightedScoreService: WeightedScoreService;
  let prisma: PrismaService;

  const mockVacancies = [
    {
      id: '1',
      title: 'Dev Backend',
      company: { id: 'c1', name: 'TechCo' },
      modality: 'Remoto',
      locationUrl: 'https://maps.google.com/...',
      skills: [
        { id: 's1', name: 'Python' },
        { id: 's2', name: 'Node.js' },
      ],
    },
    {
      id: '2',
      title: 'Dev Frontend',
      company: { id: 'c2', name: 'WebCo' },
      modality: 'Presencial',
      locationUrl: 'https://maps.google.com/...',
      skills: [{ id: 's3', name: 'React' }],
    },
  ];

  beforeEach(() => {
    jobOffersService = {
      listPublished: vi.fn().mockResolvedValue(mockVacancies),
    } as unknown as JobOffersService;

    weightedScoreService = new WeightedScoreService();

    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue({
          userSkills: [{ skill: { name: 'Python' } }, { skill: { name: 'Node.js' } }],
          educations: [{ degree: 'Ingeniería de Sistemas' }],
          workExperiences: [],
        }),
      },
    } as unknown as PrismaService;

    service = new JobRecommendationsService(
      jobOffersService,
      {} as MatchingService,
      weightedScoreService,
      prisma,
    );
  });

  it('devuelve isProfileComplete=false si el usuario no tiene skills', async () => {
    (prisma.user.findUnique as any).mockResolvedValueOnce({
      userSkills: [],
      educations: [],
      workExperiences: [],
    });
    const result = await service.getRecommendations('user-1');
    expect(result).toEqual({ isProfileComplete: false, items: [] });
  });

  it('devuelve lista vacía si no hay vacantes', async () => {
    (jobOffersService.listPublished as any).mockResolvedValueOnce([]);
    const result = await service.getRecommendations('user-1');
    expect(result).toEqual({ isProfileComplete: true, items: [] });
  });

  it('ordena por porcentaje de afinidad de mayor a menor', async () => {
    const result = await service.getRecommendations('user-1');
    expect(result.items[0].title).toBe('Dev Backend');
    expect(result.items[1].title).toBe('Dev Frontend');
  });

  it('calcula correctamente el porcentaje de afinidad', async () => {
    const result = await service.getRecommendations('user-1');
    expect(result.items[0].score).toBeGreaterThanOrEqual(0);
    expect(result.items[0].score).toBeLessThanOrEqual(100);
    expect(result.items[0].jobOfferId).toBe('1');
    expect(result.items[0].companyName).toBe('TechCo');
  });
});