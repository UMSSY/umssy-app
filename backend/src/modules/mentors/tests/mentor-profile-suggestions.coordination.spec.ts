import {
  toMentorProfileSnapshot,
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';
import { describe, expect, it, vi } from 'vitest';
import { MentorsService } from '../services/mentors.service.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';

describe('MentorsService suggestion coordination', () => {
  function setup(profile: ReturnType<typeof buildMentorProfile> | null) {
    const findActiveMentorProfileSnapshot = vi
      .fn()
      .mockResolvedValue(toMentorProfileSnapshot(profile));
    const repository = {
      findActiveMentorProfileSnapshot,
    } as unknown as MentorsRepository;
    const evaluator = new MentorProfileSuggestionsService(repository);
    const findSuggestions = vi.spyOn(evaluator, 'findSuggestions');
    const mapper = new MentorMapper();
    const toResponse = vi.spyOn(mapper, 'toProfileSuggestionsResponse');
    const service = new MentorsService(
      repository,
      mapper,
      {} as UserSkillService,
      evaluator,
    );
    return {
      service,
      findSuggestions,
      toResponse,
      findActiveMentorProfileSnapshot,
    };
  }

  it('delegates detection to the existing evaluator and transformation to the mapper', async () => {
    const {
      service,
      findSuggestions,
      toResponse,
      findActiveMentorProfileSnapshot,
    } = setup(buildEmptyMentorProfile());
    const result = await service.findMyProfileSuggestions('session-user');
    expect(findSuggestions).toHaveBeenCalledExactlyOnceWith('session-user');
    expect(toResponse).toHaveBeenCalledExactlyOnceWith(
      await findSuggestions.mock.results[0]?.value,
    );
    expect(result).toBe(toResponse.mock.results[0]?.value);
    expect(result.pendingCount).toBe(4);
    expect(findActiveMentorProfileSnapshot).toHaveBeenCalledExactlyOnceWith(
      'session-user',
      expect.any(Date),
    );
  });

  it.each([null, buildMentorProfile()])(
    'preserves empty evaluation results',
    async (profile) => {
      const { service } = setup(profile);
      expect(await service.findMyProfileSuggestions('user')).toEqual({
        suggestions: [],
        pendingCount: 0,
      });
    },
  );

  it('propagates read failures without mapping a successful empty response', async () => {
    const { service, findActiveMentorProfileSnapshot, toResponse } =
      setup(null);
    const error = new Error('read failed');
    findActiveMentorProfileSnapshot.mockRejectedValueOnce(error);
    await expect(service.findMyProfileSuggestions('user')).rejects.toBe(error);
    expect(toResponse).not.toHaveBeenCalled();
  });
});
