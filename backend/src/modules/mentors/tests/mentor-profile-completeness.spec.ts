import { describe, expect, expectTypeOf, it } from 'vitest';
import type { MentorProfileEvaluation } from '../types/mentor-profile-evaluation.types.js';
import { normalizeProfileText } from '../utils/mentor-profile-completeness.js';
import {
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';

describe('normalizeProfileText', () => {
  it.each([null, '', ' ', '   ', '\t\r\n', '\u00a0'])(
    'normalizes empty text %j',
    (value) => {
      expect(normalizeProfileText(value)).toBe('');
    },
  );
  it.each([
    ['Mentora', 'Mentora'],
    ['  Mentora de ingeniería  ', 'Mentora de ingeniería'],
    ['\n Desarrollo backend\t', 'Desarrollo backend'],
    ['  Experiencia  en\nsoftware  ', 'Experiencia  en\nsoftware'],
  ])('normalizes %j preserving meaningful content', (value, expected) => {
    expect(normalizeProfileText(value)).toBe(expected);
  });
  it('leaves the source profile unchanged', () => {
    const profile = Object.freeze(
      buildMentorProfile({ aboutMe: '  Mentora  ' }),
    );
    expect(normalizeProfileText(profile.aboutMe)).toBe('Mentora');
    expect(profile.aboutMe).toBe('  Mentora  ');
  });
});

describe('mentor profile fixtures', () => {
  it('matches the evaluation input to the existing repository record', () => {
    expectTypeOf<
      ReturnType<typeof buildMentorProfile>
    >().toExtend<MentorProfileEvaluation>();
  });
  it('builds complete and empty professional sections', () => {
    const complete = buildMentorProfile();
    expect(complete.photoUrl?.length).toBeGreaterThan(0);
    expect(complete.aboutMe).toBeTruthy();
    expect(complete.mentorTechnicalAreas).toHaveLength(1);
    expect(complete.workExperiences).toHaveLength(1);
    expect(buildEmptyMentorProfile()).toMatchObject({
      photoUrl: null,
      aboutMe: null,
      mentorTechnicalAreas: [],
      workExperiences: [],
    });
  });
  it('creates independent mutable data for each test', () => {
    const first = buildMentorProfile();
    const second = buildMentorProfile();
    first.photoUrl?.fill(0);
    first.mentorTechnicalAreas.length = 0;
    first.workExperiences[0].startDate.setUTCFullYear(2000);
    expect(second.photoUrl?.[0]).toBe(0x89);
    expect(second.mentorTechnicalAreas).toHaveLength(1);
    expect(second.workExperiences[0].startDate.getUTCFullYear()).toBe(2024);
  });
});
