import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfileService } from '../services/candidate-profile.service.js';
import { JobMatchService } from '../services/job-match.service.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import type { RequirementTermsService } from '../services/requirement-terms.service.js';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { VacancyScoringService } from '../services/vacancy-scoring.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

const USER_ID = 'user-1';
const DOCKER = { id: 'skill-docker', name: 'Docker' };

function offer(skills: string[], description: string): JobMatchRecord {
  return {
    id: 'offer-1',
    title: 'DevOps',
    description,
    locationUrl: 'https://maps.google.com/?q=x',
    requiredCareers: [],
    minExperienceYears: null,
    otherRequirements: [],
    company: { title: 'Empresa' },
    modality: { title: 'Remoto' },
    skills: skills.map((name) => ({ skill: { name } })),
  } as JobMatchRecord;
}

describe('VacancyScoringService', () => {
  const getUserSkills = vi.fn();
  const findCandidateProfile = vi.fn();
  const extractAndMatchRequirements = vi.fn();
  let scoring: VacancyScoringService;

  beforeEach(() => {
    vi.resetAllMocks();
    getUserSkills.mockResolvedValue([{ name: 'Python' }]);
    findCandidateProfile.mockResolvedValue({ career: null, experienceYears: 0 });
    extractAndMatchRequirements.mockImplementation((text: string) =>
      Promise.resolve(text.includes('Docker') ? [DOCKER] : []),
    );
    scoring = new VacancyScoringService(
      { getUserSkills } as unknown as UserSkillService,
      { findCandidateProfile } as unknown as CandidateProfileService,
      { extractAndMatchRequirements } as unknown as RequirementTermsService,
      new WeightedScoreService(),
    );
  });

  it('no repite una habilidad que también aparece en la descripción', async () => {
    const { requirements } = await scoring.evaluate(
      offer(['docker'], 'Usamos Docker'),
      { skills: [] },
    );

    expect(requirements.skills).toEqual([{ name: 'docker', status: 'Pendiente' }]);
  });

  it('trata a un usuario sin perfil como candidato sin habilidades', async () => {
    getUserSkills.mockRejectedValue(new ProfileNotFoundException());

    await expect(scoring.getCandidate(USER_ID)).resolves.toMatchObject({
      skills: [],
    });
  });

  it('propaga otros errores al obtener las habilidades', async () => {
    getUserSkills.mockRejectedValue(new Error('connection refused'));

    await expect(scoring.getCandidate(USER_ID)).rejects.toThrow(
      'connection refused',
    );
  });

  it('la tarjeta y el detalle muestran el mismo porcentaje', async () => {
    const vacancy = offer(['Python'], 'Usamos Docker');
    const jobMatchRepository = {
      findPublished: vi.fn().mockResolvedValue([vacancy]),
      findPublishedById: vi.fn().mockResolvedValue(vacancy),
    } as unknown as JobMatchRepository;

    const detail = await new JobMatchService(
      jobMatchRepository,
      scoring,
    ).getMatch(USER_ID, vacancy.id);
    const feed = await new JobRecommendationsService(
      {} as JobOffersService,
      jobMatchRepository,
      scoring,
      new VacancyRankingService(),
    ).recommendations(USER_ID);

    expect(detail.score).toBe(50);
    expect(feed.items[0].score).toBe(detail.score);
    expect(detail.requirements.map(({ name }) => name)).toEqual([
      'Python',
      'Docker',
    ]);
  });
});
