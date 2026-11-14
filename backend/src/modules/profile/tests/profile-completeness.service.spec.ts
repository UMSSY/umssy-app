import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CertificationSourcesService } from '../../certifications/services/certification-sources.service.js';
import type { EducationSourcesService } from '../../educations/services/education-sources.service.js';
import type { SkillAnalysisService } from '../../skills/services/skill-analysis.service.js';
import type { WorkExperienceSourcesService } from '../../work-experience/services/work-experience-sources.service.js';
import type { CvSourcesService } from '../../cv/services/cv-sources.service.js';
import { ProfileNotFoundException } from '../exceptions/profile-not-found.exception.js';
import type { ProfileRepository } from '../repositories/profile.repository.js';
import { ProfileCompletenessService } from '../services/profile-completeness.service.js';
import type { ProfileRecord } from '../types/profile-record.type.js';

const userId = '11111111-1111-4111-8111-111111111111';
const profile: ProfileRecord = {
  id: userId,
  firstName: 'Taylor',
  lastName: 'Smith',
  email: 'taylor@example.test',
  personalEmail: 'contact@example.test',
  phone: '+591 70000000',
  city: { id: '22222222-2222-4222-8222-222222222222', title: 'Cochabamba' },
  headline: 'Software developer',
  aboutMe: 'I build web applications.',
  updatedAt: new Date('2026-11-09T12:00:00Z'),
};
const emptyProfile: ProfileRecord = {
  ...profile,
  personalEmail: null,
  phone: null,
  city: null,
  headline: null,
  aboutMe: null,
};

describe('ProfileCompletenessService', () => {
  const profiles = { findByUserId: vi.fn() };
  const educations = { hasByUserId: vi.fn() };
  const experiences = { hasByUserId: vi.fn() };
  const skills = { hasProfileSkills: vi.fn() };
  const certifications = { hasByUserId: vi.fn() };
  const cvs = { hasByUserId: vi.fn() };
  const service = new ProfileCompletenessService(
    profiles as unknown as ProfileRepository,
    educations as unknown as EducationSourcesService,
    experiences as unknown as WorkExperienceSourcesService,
    skills as unknown as SkillAnalysisService,
    certifications as unknown as CertificationSourcesService,
    cvs as unknown as CvSourcesService,
  );

  beforeEach(() => {
    vi.resetAllMocks();
    profiles.findByUserId.mockResolvedValue(emptyProfile);
    educations.hasByUserId.mockResolvedValue(false);
    experiences.hasByUserId.mockResolvedValue(false);
    skills.hasProfileSkills.mockResolvedValue(false);
    certifications.hasByUserId.mockResolvedValue(false);
    cvs.hasByUserId.mockResolvedValue(false);
  });

  it('returns zero for an account with no completed profile sections', async () => {
    await expect(service.getCompleteness(userId)).resolves.toEqual({
      percentage: 0,
      sections: [
        { id: 'contact', weight: 15, isCompleted: false },
        { id: 'presentation', weight: 15, isCompleted: false },
        { id: 'education', weight: 15, isCompleted: false },
        { id: 'work-experience', weight: 15, isCompleted: false },
        { id: 'skills', weight: 15, isCompleted: false },
        { id: 'certifications', weight: 10, isCompleted: false },
        { id: 'cv', weight: 15, isCompleted: false },
      ],
    });
  });

  it('returns 30 percent for completed contact information and saved skills', async () => {
    profiles.findByUserId.mockResolvedValue({
      ...profile,
      headline: null,
      aboutMe: null,
    });
    skills.hasProfileSkills.mockResolvedValue(true);
    const result = await service.getCompleteness(userId);
    expect(result.percentage).toBe(30);
    expect(
      result.sections
        .filter((section) => section.isCompleted)
        .map((section) => section.id),
    ).toEqual(['contact', 'skills']);
  });

  it('returns 100 percent when all seven sections are complete', async () => {
    profiles.findByUserId.mockResolvedValue(profile);
    educations.hasByUserId.mockResolvedValue(true);
    experiences.hasByUserId.mockResolvedValue(true);
    skills.hasProfileSkills.mockResolvedValue(true);
    certifications.hasByUserId.mockResolvedValue(true);
    cvs.hasByUserId.mockResolvedValue(true);
    const result = await service.getCompleteness(userId);
    expect(result.percentage).toBe(100);
    expect(result.sections).toHaveLength(7);
    expect(result.sections.every((section) => section.isCompleted)).toBe(true);
  });

  it.each([
    ['education', educations.hasByUserId, 15],
    ['work-experience', experiences.hasByUserId, 15],
    ['skills', skills.hasProfileSkills, 15],
    ['certifications', certifications.hasByUserId, 10],
    ['cv', cvs.hasByUserId, 15],
  ] as const)(
    'awards the full %s weight once and removes it when the last record is deleted',
    async (id, lookup, weight) => {
      lookup.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
      const saved = await service.getCompleteness(userId);
      expect(saved.percentage).toBe(weight);
      expect(
        saved.sections.find((section) => section.id === id)?.isCompleted,
      ).toBe(true);
      expect((await service.getCompleteness(userId)).percentage).toBe(0);
    },
  );

  it('keeps the profile at 85 percent until a CV is saved, and returns to 85 after the last CV is deleted', async () => {
    profiles.findByUserId.mockResolvedValue(profile);
    educations.hasByUserId.mockResolvedValue(true);
    experiences.hasByUserId.mockResolvedValue(true);
    skills.hasProfileSkills.mockResolvedValue(true);
    certifications.hasByUserId.mockResolvedValue(true);
    expect((await service.getCompleteness(userId)).percentage).toBe(85);
    cvs.hasByUserId.mockResolvedValue(true);
    expect((await service.getCompleteness(userId)).percentage).toBe(100);
    cvs.hasByUserId.mockResolvedValue(false);
    expect((await service.getCompleteness(userId)).percentage).toBe(85);
  });

  it.each([
    { firstName: '   ' },
    { lastName: '' },
    { personalEmail: null },
    { personalEmail: 'not-an-email' },
    { phone: null },
    { phone: '123' },
    { phone: 'letters-only' },
    { city: null },
  ])(
    'does not award contact points for incomplete or invalid contact data: %j',
    async (changes) => {
      profiles.findByUserId.mockResolvedValue({ ...profile, ...changes });
      const result = await service.getCompleteness(userId);
      expect(result.percentage).toBe(15);
      expect(
        result.sections.find((section) => section.id === 'contact')
          ?.isCompleted,
      ).toBe(false);
    },
  );

  it.each([
    { headline: null },
    { headline: '   ' },
    { aboutMe: null },
    { aboutMe: '' },
    { headline: 'x'.repeat(151) },
  ])('requires both valid presentation fields: %j', async (changes) => {
    profiles.findByUserId.mockResolvedValue({ ...profile, ...changes });
    expect((await service.getCompleteness(userId)).percentage).toBe(15);
  });

  it('accepts surrounding whitespace without mutating saved data', async () => {
    const padded = {
      ...profile,
      firstName: ' Taylor ',
      aboutMe: ' Web developer ',
    };
    profiles.findByUserId.mockResolvedValue(padded);
    expect((await service.getCompleteness(userId)).percentage).toBe(30);
    expect(padded.firstName).toBe(' Taylor ');
    expect(padded.aboutMe).toBe(' Web developer ');
  });

  it('scopes every lookup to the requested owner', async () => {
    await service.getCompleteness(userId);
    for (const lookup of [
      profiles.findByUserId,
      educations.hasByUserId,
      experiences.hasByUserId,
      skills.hasProfileSkills,
      certifications.hasByUserId,
      cvs.hasByUserId,
    ]) {
      expect(lookup).toHaveBeenCalledExactlyOnceWith(userId);
    }
  });

  it('rejects missing profiles before reading other sections', async () => {
    profiles.findByUserId.mockResolvedValue(null);
    await expect(service.getCompleteness(userId)).rejects.toBeInstanceOf(
      ProfileNotFoundException,
    );
    expect(educations.hasByUserId).not.toHaveBeenCalled();
    expect(experiences.hasByUserId).not.toHaveBeenCalled();
    expect(skills.hasProfileSkills).not.toHaveBeenCalled();
    expect(certifications.hasByUserId).not.toHaveBeenCalled();
    expect(cvs.hasByUserId).not.toHaveBeenCalled();
  });

  it('propagates database failures instead of returning a misleading partial percentage', async () => {
    certifications.hasByUserId.mockRejectedValue(
      new Error('Database unavailable'),
    );
    await expect(service.getCompleteness(userId)).rejects.toThrow(
      'Database unavailable',
    );
  });
});
