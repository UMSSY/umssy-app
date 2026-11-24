import {
  toMentorProfileSnapshot,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';
import { describe, expect, it, vi } from 'vitest';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';

// Explicit expected code order is independent of the production detection functions.
const combinations = Array.from({ length: 16 }, (_, mask) => ({
  mask,
  photo: Boolean(mask & 8),
  description: Boolean(mask & 4),
  specialty: Boolean(mask & 2),
  experience: Boolean(mask & 1),
}));

describe('profile completeness combinations', () => {
  it.each(combinations)(
    'evaluates presence mask $mask (photo=$photo, description=$description, specialty=$specialty, experience=$experience)',
    async ({ photo, description, specialty, experience }) => {
      const complete = buildMentorProfile();
      const profile = buildMentorProfile({
        photoUrl: photo ? complete.photoUrl : null,
        aboutMe: description ? complete.aboutMe : null,
        mentorTechnicalAreas: specialty ? complete.mentorTechnicalAreas : [],
        workExperiences: experience ? complete.workExperiences : [],
      });
      const findActiveMentorProfileSnapshot = vi
        .fn<MentorsRepository['findActiveMentorProfileSnapshot']>()
        .mockResolvedValue(toMentorProfileSnapshot(profile));
      const service = new MentorProfileSuggestionsService({
        findActiveMentorProfileSnapshot,
      } as unknown as MentorsRepository);
      const expected = [
        ...(!photo
          ? [{ code: 'MISSING_PROFILE_PHOTO', field: 'photoUrl' }]
          : []),
        ...(!description
          ? [{ code: 'MISSING_PROFESSIONAL_DESCRIPTION', field: 'aboutMe' }]
          : []),
        ...(!specialty
          ? [{ code: 'MISSING_SPECIALTY', field: 'mentorTechnicalAreas' }]
          : []),
        ...(!experience
          ? [{ code: 'MISSING_WORK_EXPERIENCE', field: 'workExperiences' }]
          : []),
      ];
      const response = new MentorMapper().toProfileSuggestionsResponse(
        await service.findSuggestions(profile.id),
      );
      const result = response.suggestions;
      expect(response.pendingCount).toBe(expected.length);
      expect(response.pendingCount).toBe(result.length);
      expect(result.map(({ code, field }) => ({ code, field }))).toEqual(
        expected,
      );
      expect(new Set(result.map(({ code }) => code)).size).toBe(result.length);
      expect(result.every(({ message }) => message.trim().length > 0)).toBe(
        true,
      );
    },
  );
});
