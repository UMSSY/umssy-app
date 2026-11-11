import { afterEach, describe, expect, it, vi } from 'vitest';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import {
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';

type Profile = ReturnType<typeof buildMentorProfile>;

function setup(profile: Profile | null) {
  const findActiveMentorById = vi
    .fn<MentorsRepository['findActiveMentorById']>()
    .mockResolvedValue(profile);
  const repository = { findActiveMentorById } as unknown as MentorsRepository;
  return {
    service: new MentorProfileSuggestionsService(repository),
    findActiveMentorById,
  };
}

describe('MentorProfileSuggestionsService', () => {
  afterEach(() => vi.useRealTimers());

  it('queries the existing active mentor reader once with the current date', async () => {
    vi.useFakeTimers();
    const now = new Date('2026-11-11T16:00:00.000Z');
    vi.setSystemTime(now);
    const { service, findActiveMentorById } = setup(buildMentorProfile());
    expect(await service.findSuggestions('mentor-1')).toEqual([]);
    expect(findActiveMentorById).toHaveBeenCalledExactlyOnceWith(
      'mentor-1',
      now,
    );
  });

  it('returns no suggestions when the repository finds no active mentor', async () => {
    const { service } = setup(null);
    expect(await service.findSuggestions('inactive')).toEqual([]);
  });

  it('returns the four specific suggestions in stable order without duplicates', async () => {
    const { service } = setup(buildEmptyMentorProfile());
    const result = await service.findSuggestions('mentor-1');
    expect(result).toEqual([
      {
        code: 'MISSING_PROFILE_PHOTO',
        field: 'photoUrl',
        message: 'Agrega una fotografía a tu perfil.',
      },
      {
        code: 'MISSING_PROFESSIONAL_DESCRIPTION',
        field: 'aboutMe',
        message: 'Completa tu descripción profesional.',
      },
      {
        code: 'MISSING_SPECIALTY',
        field: 'mentorTechnicalAreas',
        message: 'Agrega al menos un área técnica como especialidad.',
      },
      {
        code: 'MISSING_WORK_EXPERIENCE',
        field: 'workExperiences',
        message: 'Registra tu experiencia laboral.',
      },
    ]);
    expect(new Set(result.map(({ code }) => code)).size).toBe(result.length);
    expect(await service.findSuggestions('mentor-1')).toEqual(result);
  });

  it.each([
    {
      overrides: { aboutMe: '  ', workExperiences: [] },
      expected: ['MISSING_PROFESSIONAL_DESCRIPTION', 'MISSING_WORK_EXPERIENCE'],
    },
    {
      overrides: { photoUrl: new Uint8Array(), mentorTechnicalAreas: [] },
      expected: ['MISSING_PROFILE_PHOTO', 'MISSING_SPECIALTY'],
    },
    { overrides: { photoUrl: null }, expected: ['MISSING_PROFILE_PHOTO'] },
    { overrides: {}, expected: [] },
  ])(
    'only recommends incomplete sections: $expected',
    async ({ overrides, expected }) => {
      const { service } = setup(buildMentorProfile(overrides));
      expect(
        (await service.findSuggestions('mentor-1')).map(({ code }) => code),
      ).toEqual(expected);
    },
  );

  it.each([true, false])(
    'evaluates active mentors with availability %s',
    async (isAvailableForMentoring) => {
      const { service } = setup(
        buildMentorProfile({ isAvailableForMentoring, aboutMe: null }),
      );
      expect(await service.findSuggestions('mentor-1')).toMatchObject([
        { code: 'MISSING_PROFESSIONAL_DESCRIPTION' },
      ]);
    },
  );

  it('does not mutate the profile or perform writes', async () => {
    const profile = buildEmptyMentorProfile();
    const before = structuredClone(profile);
    Object.freeze(profile.mentorTechnicalAreas);
    Object.freeze(profile.workExperiences);
    Object.freeze(profile);
    // This repository intentionally exposes only the read method; any write fails.
    const { service, findActiveMentorById } = setup(profile);
    await service.findSuggestions('mentor-1');
    expect(profile).toEqual(before);
    expect(findActiveMentorById).toHaveBeenCalledTimes(1);
  });

  it('propagates read failures instead of reporting a complete profile', async () => {
    const { service, findActiveMentorById } = setup(null);
    const error = new Error('database unavailable');
    findActiveMentorById.mockRejectedValueOnce(error);
    await expect(service.findSuggestions('mentor-1')).rejects.toBe(error);
  });

  it.each([
    { isActive: true, roles: [] },
    { isActive: false, roles: [{ deletedAt: null, startAt: new Date(0) }] },
    {
      isActive: true,
      roles: [{ deletedAt: new Date(0), startAt: new Date(0) }],
    },
    {
      isActive: true,
      roles: [{ deletedAt: null, startAt: new Date('2099-01-01') }],
    },
  ])(
    'delegates inactive user filtering to the unchanged repository: %j',
    async (user) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-11T16:00:00.000Z'));
      const findFirst = vi.fn().mockImplementation(({ where }) => {
        expect(where.isActive).toBe(true);
        expect(where.roles.some.deletedAt).toBeNull();
        expect(where.roles.some.role.name).toBe('mentor');
        return user.isActive &&
          user.roles.some(
            (role) =>
              role.deletedAt === null &&
              role.startAt <= where.roles.some.startAt.lte,
          )
          ? buildMentorProfile()
          : null;
      });
      const repository = new MentorsRepository({
        user: { findFirst },
      } as unknown as PrismaService);
      expect(
        await new MentorProfileSuggestionsService(repository).findSuggestions(
          'user-1',
        ),
      ).toEqual([]);
      expect(findFirst).toHaveBeenCalledTimes(1);
    },
  );
});
