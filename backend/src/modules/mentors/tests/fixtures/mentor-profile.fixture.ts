import type { MentorsRepository } from '../../repositories/mentors.repository.js';
import type { MentorProfileSnapshot } from '../../types/mentor-profile-snapshot.types.js';

type MentorProfileRecord = NonNullable<
  Awaited<ReturnType<MentorsRepository['findActiveMentorById']>>
>;

export function toMentorProfileSnapshot(
  profile: MentorProfileRecord | null,
): MentorProfileSnapshot | null {
  if (!profile) return null;
  return {
    photoByteLength: profile.photoUrl?.length ?? null,
    aboutMe: profile.aboutMe,
    hasTechnicalAreas: profile.mentorTechnicalAreas.length > 0,
    hasWorkExperience: profile.workExperiences.length > 0,
  };
}

export function buildMentorProfile(
  overrides: Partial<MentorProfileRecord> = {},
): MentorProfileRecord {
  return {
    id: 'mentor-1',
    firstName: 'Ana',
    lastName: 'Rojas',
    headline: null,
    aboutMe: 'Mentora de ingeniería de software.',
    isAvailableForMentoring: true,
    photoUrl: new Uint8Array([0x89, 0x50, 0x4e, 0x47]),
    city: null,
    educations: [],
    certifications: [],
    mentorOrientationTypes: [],
    mentorTechnicalAreas: [
      { technicalArea: { id: 'area-1', name: 'Backend', description: null } },
    ],
    workExperiences: [
      {
        id: 'work-1',
        position: 'Desarrolladora',
        startDate: new Date('2024-01-01T00:00:00.000Z'),
        endDate: null,
        isCurrent: true,
        description: null,
        company: { id: 'company-1', title: 'Acme' },
      },
    ],
    ...overrides,
  };
}

export function buildEmptyMentorProfile(): MentorProfileRecord {
  return buildMentorProfile({
    photoUrl: null,
    aboutMe: null,
    mentorTechnicalAreas: [],
    workExperiences: [],
  });
}
