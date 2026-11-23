import { describe, expect, it } from 'vitest';
import { isMentorSpecialtyMissing } from '../utils/mentor-profile-completeness.js';
import { buildMentorProfile } from './fixtures/mentor-profile.fixture.js';

describe('isMentorSpecialtyMissing', () => {
  it.each([true, false])(
    'accepts the projected existence flag %s',
    (present) => {
      expect(isMentorSpecialtyMissing(present)).toBe(!present);
    },
  );
  it('detects an empty collection', () => {
    expect(isMentorSpecialtyMissing([])).toBe(true);
  });
  it('accepts registered technical areas', () => {
    const { mentorTechnicalAreas } = buildMentorProfile();
    expect(isMentorSpecialtyMissing(mentorTechnicalAreas)).toBe(false);
    expect(
      isMentorSpecialtyMissing([
        ...mentorTechnicalAreas,
        {
          technicalArea: { id: 'area-2', name: 'Frontend', description: null },
        },
      ]),
    ).toBe(false);
  });
  it('does not substitute a professional headline for technical areas', () => {
    const profile = buildMentorProfile({
      headline: 'Especialista en software',
      mentorTechnicalAreas: [],
    });
    expect(isMentorSpecialtyMissing(profile.mentorTechnicalAreas)).toBe(true);
    const withoutHeadline = buildMentorProfile({ headline: null });
    expect(isMentorSpecialtyMissing(withoutHeadline.mentorTechnicalAreas)).toBe(
      false,
    );
  });
  it('accepts a frozen collection without changing its records', () => {
    const areas = buildMentorProfile().mentorTechnicalAreas;
    const before = structuredClone(areas);
    Object.freeze(areas[0].technicalArea);
    Object.freeze(areas[0]);
    expect(isMentorSpecialtyMissing(Object.freeze(areas))).toBe(false);
    expect(areas).toEqual(before);
  });
});
