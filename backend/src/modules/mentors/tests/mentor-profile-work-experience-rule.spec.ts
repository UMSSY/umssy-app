import { describe, expect, it } from 'vitest';
import { isWorkExperienceMissing } from '../utils/mentor-profile-completeness.js';
import { buildMentorProfile } from './fixtures/mentor-profile.fixture.js';

describe('isWorkExperienceMissing', () => {
  it('detects absent experience records', () => {
    expect(isWorkExperienceMissing([])).toBe(true);
  });
  it('accepts a current job without an end date or optional description', () => {
    const { workExperiences } = buildMentorProfile();
    expect(workExperiences[0]).toMatchObject({
      isCurrent: true,
      endDate: null,
      description: null,
    });
    expect(isWorkExperienceMissing(workExperiences)).toBe(false);
  });
  it('accepts past jobs and multiple records', () => {
    const { workExperiences } = buildMentorProfile();
    const pastJob = {
      ...workExperiences[0],
      id: 'work-2',
      isCurrent: false,
      endDate: new Date('2025-01-01T00:00:00.000Z'),
    };
    expect(isWorkExperienceMissing([pastJob])).toBe(false);
    expect(isWorkExperienceMissing([...workExperiences, pastJob])).toBe(false);
  });
  it('accepts a frozen collection without changing its records', () => {
    const records = buildMentorProfile().workExperiences;
    const before = structuredClone(records);
    Object.freeze(records[0].company);
    Object.freeze(records[0]);
    expect(isWorkExperienceMissing(Object.freeze(records))).toBe(false);
    expect(records).toEqual(before);
  });
});
