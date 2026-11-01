import { describe, expect, it, vi } from 'vitest';
import type { JobOffersService } from '../../job-offers/services/job-offers.service.js';
import type { SkillCatalogService } from '../../skills/services/skill-catalog.service.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfileService } from '../services/candidate-profile.service.js';
import { JobMatchService } from '../services/job-match.service.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import { NlpService } from '../services/nlp.service.js';
import { RequirementTermsService } from '../services/requirement-terms.service.js';
import { SkillsClassifierService } from '../services/skills-classifier.service.js';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

function setup(names: string[], explicitSkills: string[] = ['Python']) {
  const vacancy = {
    id: 'offer',
    title: 'Backend developer',
    description: 'Requerimos Python y SQL',
    locationUrl: '',
    requiredCareers: [],
    minExperienceYears: null,
    otherRequirements: [],
    company: { title: 'Empresa' },
    modality: { title: 'Remoto' },
    skills: explicitSkills.map((name) => ({ skill: { name } })),
  } as JobMatchRecord;
  const repository = {
    findPublished: vi.fn().mockResolvedValue([vacancy]),
    findPublishedById: vi.fn().mockResolvedValue(vacancy),
  } as unknown as JobMatchRepository;
  const profile = {
    findCandidateProfile: vi
      .fn()
      .mockResolvedValue({ career: null, experienceYears: 0 }),
  } as unknown as CandidateProfileService;
  const skills = {
    getUserSkills: vi
      .fn()
      .mockResolvedValue(
        names.map((name) => ({ id: name, name, isCustom: false })),
      ),
  } as unknown as UserSkillService;
  const catalog = {
    listCatalog: vi
      .fn()
      .mockResolvedValue(
        ['Python', 'SQL'].map((name) => ({ id: name, name, isCustom: false })),
      ),
  } as unknown as SkillCatalogService;
  const terms = new RequirementTermsService(
    new NlpService(),
    new SkillsClassifierService(),
    catalog,
  );
  const weights = new WeightedScoreService();
  const feed = new JobRecommendationsService(
    {} as JobOffersService,
    skills,
    profile,
    repository,
    new VacancyRankingService(),
    weights,
    terms,
  );
  return {
    feed,
    detail: new JobMatchService(repository, skills, profile, weights, terms),
  };
}

describe('HU-06 AC-06.3: feed and detail use the same tokenized requirements', () => {
  it.each([
    { skills: ['Python'], expected: 50 },
    { skills: ['python', 'sql'], expected: 100 },
    { skills: ['Java'], expected: 0 },
  ])(
    'keeps both percentages equal for $skills',
    async ({ skills, expected }) => {
      const { feed, detail } = setup(skills);
      const [recommendations, match] = await Promise.all([
        feed.recommendations('user'),
        detail.getMatch('user', 'offer'),
      ]);
      expect(recommendations.items[0].score).toBe(expected);
      expect(match.score).toBe(expected);
      expect(match.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: 'SQL', category: 'skill' }),
        ]),
      );
      expect(match.hasPendingRequirements).toBe(expected !== 100);
    },
  );

  it('does not count a skill twice when it exists in both the catalog selection and description', async () => {
    const { feed, detail } = setup(['Python'], ['Python', 'sql']);
    const match = await detail.getMatch('user', 'offer');
    expect(match.requirements).toHaveLength(2);
    expect(match.score).toBe(50);
    expect((await feed.recommendations('user')).items[0].score).toBe(
      match.score,
    );
  });
});
