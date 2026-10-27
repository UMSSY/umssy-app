import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ProfileNotFoundException } from '../../profile/exceptions/profile-not-found.exception.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import type { JobMatchRepository } from '../repositories/job-match.repository.js';
import type { CandidateProfileService } from '../services/candidate-profile.service.js';
import { JobRecommendationsService } from '../services/job-recommendations.service.js';
import { VacancyRankingService } from '../services/vacancy-ranking.service.js';
import { WeightedScoreService } from '../services/weighted-score.service.js';
import type { JobMatchRecord } from '../types/job-match.types.js';

interface OfferOptions {
  careers?: string[];
  minExperienceYears?: number | null;
}

function offer(
  id: string,
  skills: string[],
  options: OfferOptions = {},
): JobMatchRecord {
  return {
    id,
    title: id,
    description: 'Descripción',
    locationUrl: 'https://maps.google.com/?q=x',
    requiredCareers: options.careers ?? [],
    minExperienceYears: options.minExperienceYears ?? null,
    otherRequirements: [],
    company: { title: 'Empresa' },
    modality: { title: 'Remoto' },
    skills: skills.map((name) => ({ skill: { name } })),
  } as JobMatchRecord;
}

const skill = (name: string) => ({ id: `id-${name}`, name, isCustom: false });

describe('HU-06 recommendations contract', () => {
  const getUserSkills = vi.fn();
  const findPublished = vi.fn();
  const findCandidateProfile = vi.fn();
  let service: JobRecommendationsService;

  beforeEach(() => {
    getUserSkills.mockReset().mockResolvedValue([skill('Python')]);
    findPublished
      .mockReset()
      .mockResolvedValue([
        offer('partial', ['Python', 'SQL']),
        offer('none', ['Java']),
        offer('perfect', ['python']),
        offer('unrestricted', []),
      ]);
    findCandidateProfile
      .mockReset()
      .mockResolvedValue({ career: null, experienceYears: 0 });
    service = new JobRecommendationsService(
      { getUserSkills } as unknown as UserSkillService,
      { findCandidateProfile } as unknown as CandidateProfileService,
      { findPublished } as unknown as JobMatchRepository,
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
    expect(getUserSkills).toHaveBeenCalledWith('user');
    expect(findCandidateProfile).toHaveBeenCalledWith('user');
  });

  it('returns the location link and the skills of every offer', async () => {
    const result = await service.recommendations('user');
    const partial = result.items.find((item) => item.jobOfferId === 'partial');

    expect(partial).toEqual({
      jobOfferId: 'partial',
      title: 'partial',
      companyName: 'Empresa',
      modality: 'Remoto',
      locationUrl: 'https://maps.google.com/?q=x',
      score: 50,
      skills: ['Python', 'SQL'],
      matchedSkills: ['Python'],
    });
  });

  it('recalculates on every request after profile skills change', async () => {
    const scoreOf = async () =>
      (await service.recommendations('user')).items.find(
        (item) => item.jobOfferId === 'partial',
      )?.score;
    expect(await scoreOf()).toBe(50);
    getUserSkills.mockResolvedValue([skill('Python'), skill('SQL')]);
    expect(await scoreOf()).toBe(100);
  });

  it('uses the career and the experience of the profile in the score and in the tie break', async () => {
    findCandidateProfile.mockResolvedValue({
      career: 'Ingeniería de Sistemas',
      experienceYears: 1,
    });
    findPublished.mockResolvedValue([
      offer('other-career', ['Python'], { careers: ['Ingeniería Comercial'] }),
      offer('needs-experience', ['Python'], { minExperienceYears: 5 }),
      offer('match', ['Python'], { careers: ['Ingeniería de Sistemas'] }),
    ]);

    const result = await service.recommendations('user');

    expect(result.items.map((item) => [item.jobOfferId, item.score])).toEqual([
      ['match', 100],
      ['needs-experience', 86],
      ['other-career', 71],
    ]);
  });

  it('breaks a tie by career first and by experience second', async () => {
    findCandidateProfile.mockResolvedValue({
      career: 'Ingeniería de Sistemas',
      experienceYears: 0,
    });
    findPublished.mockResolvedValue([
      offer('other-career', ['Python'], { careers: ['Ingeniería Comercial'] }),
      offer('same-career', ['Python'], { careers: ['Ingeniería de Sistemas'] }),
    ]);

    const result = await service.recommendations('user');

    expect(result.items.map((item) => item.jobOfferId)).toEqual([
      'same-career',
      'other-career',
    ]);
  });

  it('returns an incomplete profile without listing offers when there are no skills', async () => {
    getUserSkills.mockResolvedValue([]);
    await expect(service.recommendations('user')).resolves.toEqual({
      isProfileComplete: false,
      items: [],
    });
    expect(findPublished).not.toHaveBeenCalled();
  });

  it('returns an incomplete profile when the person has no profile yet', async () => {
    getUserSkills.mockRejectedValue(new ProfileNotFoundException());
    await expect(service.recommendations('user')).resolves.toEqual({
      isProfileComplete: false,
      items: [],
    });
    expect(findPublished).not.toHaveBeenCalled();
  });

  it('returns an empty feed when there are no published offers', async () => {
    findPublished.mockResolvedValue([]);
    await expect(service.recommendations('user')).resolves.toEqual({
      isProfileComplete: true,
      items: [],
    });
  });

  it('propagates connection failures so the UI can offer retry', async () => {
    getUserSkills.mockRejectedValue(new Error('Database unavailable'));
    await expect(service.recommendations('user')).rejects.toThrow(
      'Database unavailable',
    );
  });
});
