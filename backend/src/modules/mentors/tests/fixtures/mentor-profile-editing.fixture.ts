import { vi } from 'vitest';
import { FileValidationService } from '../../../../common/services/file-validation.service.js';
import { ProfileMapper } from '../../../profile/mappers/profile.mapper.js';
import { ProfilePhotoMapper } from '../../../profile/mappers/profile-photo.mapper.js';
import type { ProfileRepository } from '../../../profile/repositories/profile.repository.js';
import type { PhotoFileRepository } from '../../../profile/repositories/photo-file.repository.js';
import type { CityCatalogService } from '../../../profile/services/city-catalog.service.js';
import { ProfileService } from '../../../profile/services/profile.service.js';
import { ProfilePhotoService } from '../../../profile/services/profile-photo.service.js';
import type { ProfileRecord } from '../../../profile/types/profile-record.type.js';
import { WorkExperienceMapper } from '../../../work-experience/mappers/work-experience.mapper.js';
import type { WorkExperienceRepository } from '../../../work-experience/repositories/work-experience.repository.js';
import { WorkExperienceService } from '../../../work-experience/services/work-experience.service.js';
import type { ProfileSkillsAnalysisService } from '../../../nlp/services/profile-skills-analysis.service.js';
import type { UserSkillService } from '../../../skills/services/user-skill.service.js';
import { MentorMapper } from '../../mappers/mentor.mapper.js';
import type { MentorsRepository } from '../../repositories/mentors.repository.js';
import { MentorsService } from '../../services/mentors.service.js';
import { MentorProfileSuggestionsService } from '../../services/mentor-profile-suggestions.service.js';
import {
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './mentor-profile.fixture.js';

export function createMentorProfileEditingFixture(userId: string) {
  const profile = { ...buildEmptyMentorProfile(), id: userId };
  const complete = buildMentorProfile();
  const now = new Date('2026-11-11T16:00:00.000Z');
  const photo = Buffer.concat([
    Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
    Buffer.alloc(50),
    Buffer.from([0xff, 0xd9]),
  ]);

  function profileRecord(): ProfileRecord {
    return {
      id: profile.id,
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: 'mentor@test.com',
      personalEmail: null,
      phone: null,
      headline: profile.headline,
      aboutMe: profile.aboutMe,
      city: null,
      updatedAt: now,
    };
  }

  const updatePresentation = vi
    .fn<ProfileRepository['update']>()
    .mockImplementation(async (_id, data) => {
      if ('aboutMe' in data) profile.aboutMe = data.aboutMe;
      if ('headline' in data) profile.headline = data.headline;
      return profileRecord();
    });
  const profileRepository = {
    findByUserId: vi.fn(async (id: string) =>
      id === userId ? profileRecord() : null,
    ),
    update: updatePresentation,
  } as unknown as ProfileRepository;
  const savePhoto = vi
    .fn<PhotoFileRepository['save']>()
    .mockImplementation(async (_id, bytes) => {
      profile.photoUrl = new Uint8Array(bytes);
    });
  const replaceTechnicalAreas = vi
    .fn<MentorsRepository['replaceMentorTechnicalAreas']>()
    .mockImplementation(async (_id, ids) => {
      profile.mentorTechnicalAreas = structuredClone(
        complete.mentorTechnicalAreas.filter(({ technicalArea }) =>
          ids.includes(technicalArea.id),
        ),
      );
    });
  const repository = {
    findActiveMentorById: vi.fn(async (id: string) =>
      id === userId ? structuredClone(profile) : null,
    ),
    findActiveMentorParticipation: vi.fn(async (id: string) =>
      id === userId ? { id } : null,
    ),
    findTechnicalAreas: vi.fn(async (ids: string[]) =>
      complete.mentorTechnicalAreas
        .map(({ technicalArea }) => technicalArea)
        .filter(({ id }) => ids.includes(id)),
    ),
    replaceMentorTechnicalAreas: replaceTechnicalAreas,
  } as unknown as MentorsRepository;
  const createExperience = vi
    .fn<WorkExperienceRepository['create']>()
    .mockImplementation(async (id, data) => {
      const record = {
        id: 'experience-saved',
        userId: id,
        position: data.position,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrent: data.isCurrent,
        description: data.description,
        createdAt: now,
        updatedAt: now,
        company: { id: 'company-saved', title: data.companyName },
      };
      profile.workExperiences.push(record);
      return record;
    });
  const profileService = new ProfileService(
    profileRepository,
    {} as CityCatalogService,
    new ProfileMapper(),
  );
  const photoService = new ProfilePhotoService(
    profileRepository,
    { save: savePhoto } as unknown as PhotoFileRepository,
    new FileValidationService(),
    new ProfilePhotoMapper(),
  );
  const mentorsService = new MentorsService(
    repository,
    new MentorMapper(),
    {} as UserSkillService,
    new MentorProfileSuggestionsService(repository),
  );
  const experienceService = new WorkExperienceService(
    { create: createExperience } as unknown as WorkExperienceRepository,
    new WorkExperienceMapper(),
    {
      refreshAfterChange: vi.fn().mockResolvedValue(undefined),
    } as unknown as ProfileSkillsAnalysisService,
  );

  return {
    read: (id: string, now: Date) => repository.findActiveMentorById(id, now),
    snapshot: () => structuredClone(profile),
    writes: {
      updatePresentation,
      savePhoto,
      replaceTechnicalAreas,
      createExperience,
    },
    save: {
      photoUrl: () =>
        photoService.upload(userId, {
          originalname: 'mentor.jpg',
          mimetype: 'image/jpeg',
          size: photo.length,
          buffer: photo,
        }),
      aboutMe: () =>
        profileService.updatePresentation(userId, {
          headline: 'Ingeniera de software',
          aboutMe: 'Comparto mi experiencia en ingeniería de software.',
        }),
      mentorTechnicalAreas: () =>
        mentorsService.updateMyTechnicalAreas(userId, {
          technicalAreaIds: complete.mentorTechnicalAreas.map(
            ({ technicalArea }) => technicalArea.id,
          ),
        }),
      workExperiences: () =>
        experienceService.create(userId, {
          companyName: 'Empresa de software',
          position: 'Ingeniera de software',
          startDate: new Date('2024-01-01T00:00:00.000Z'),
          endDate: null,
          isCurrent: true,
          description: 'Desarrollo de aplicaciones y acompañamiento técnico.',
        }),
    },
  };
}
