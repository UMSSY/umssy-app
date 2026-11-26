import {
  toMentorProfileSnapshot,
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';
import { describe, expect, it, vi } from 'vitest';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';

describe('suggestions after profile completion', () => {
  it.each([
    { field: 'photoUrl', code: 'MISSING_PROFILE_PHOTO' },
    { field: 'aboutMe', code: 'MISSING_PROFESSIONAL_DESCRIPTION' },
    { field: 'mentorTechnicalAreas', code: 'MISSING_SPECIALTY' },
    { field: 'workExperiences', code: 'MISSING_WORK_EXPERIENCE' },
  ] as const)(
    'removes only $code when $field is completed',
    async ({ field, code }) => {
      const empty = buildEmptyMentorProfile();
      const complete = buildMentorProfile();
      const updated = { ...empty, [field]: complete[field] };
      const findActiveMentorProfileSnapshot = vi
        .fn<MentorsRepository['findActiveMentorProfileSnapshot']>()
        .mockResolvedValueOnce(toMentorProfileSnapshot(empty))
        .mockResolvedValueOnce(toMentorProfileSnapshot(updated))
        .mockResolvedValueOnce(toMentorProfileSnapshot(complete));
      const service = new MentorProfileSuggestionsService({
        findActiveMentorProfileSnapshot,
      } as unknown as MentorsRepository);
      const before = await service.findSuggestions(empty.id);
      const after = await service.findSuggestions(empty.id);
      expect(before).toHaveLength(4);
      expect(after).toEqual(
        before.filter((suggestion) => suggestion.code !== code),
      );
      expect(after).toHaveLength(3);
      expect(await service.findSuggestions(empty.id)).toEqual([]);
      expect(findActiveMentorProfileSnapshot).toHaveBeenCalledTimes(3);
    },
  );

  it('does not cache results or share mutable output between calls', async () => {
    const empty = buildEmptyMentorProfile();
    const findActiveMentorProfileSnapshot = vi
      .fn<MentorsRepository['findActiveMentorProfileSnapshot']>()
      .mockResolvedValueOnce(toMentorProfileSnapshot(empty))
      .mockResolvedValueOnce(toMentorProfileSnapshot(buildMentorProfile()))
      .mockResolvedValueOnce(toMentorProfileSnapshot(empty));
    const service = new MentorProfileSuggestionsService({
      findActiveMentorProfileSnapshot,
    } as unknown as MentorsRepository);
    const first = await service.findSuggestions(empty.id);
    const expected = structuredClone(first);
    first.length = 0;
    expect(await service.findSuggestions(empty.id)).toEqual([]);
    expect(await service.findSuggestions(empty.id)).toEqual(expected);
  });
});
