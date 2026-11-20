import { withMentorIntake } from './mentor-intake.service.js';
import { Injectable } from '@nestjs/common';
import { UserSkillService } from '../../skills/services/user-skill.service.js';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import {
  AlreadyMentorException,
  MentorCapacityException,
  MentorEligibilityException,
  InvalidOrientationTypesException,
  InvalidTechnicalAreasException,
  MentorNotFoundException,
  MentorRoleNotFoundException,
} from '../exceptions/index.js';
import type { ActivateMentorDto } from '../requests/activate-mentor.schema.js';
import type { UpdateMentorTechnicalAreasDto } from '../requests/update-mentor-technical-areas.schema.js';
import type { UpdateMentorOrientationTypesDto } from '../requests/update-mentor-orientation-types.schema.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import type { MentorDirectoryQuery } from '../requests/mentor-directory-query.schema.js';
import { MentorAffinityService } from './mentor-affinity.service.js';
import { MentorProfileSuggestionsService } from './mentor-profile-suggestions.service.js';
import type { Prisma } from '../../../prisma/client.js';

const DIRECTORY_PAGE_SIZE = 6 as const;

type DirectoryPage = {
  items: Array<
    ReturnType<MentorMapper['toDirectoryResponse']> & {
      sharedInterestsCount?: number;
    }
  >;
  page: number;
  pageSize: typeof DIRECTORY_PAGE_SIZE;
  totalItems: number;
  totalPages: number;
  effectiveSort: MentorDirectoryQuery['sort'];
  affinityStatus?: 'ready' | 'no_skills' | 'unmapped_skills';
};

@Injectable()
export class MentorsService {
  constructor(
    private readonly mentorsRepository: MentorsRepository,
    private readonly mentorMapper: MentorMapper,
    private readonly userSkillService: UserSkillService,
    private readonly mentorProfileSuggestionsService: MentorProfileSuggestionsService,
    private readonly mentorAffinityService?: MentorAffinityService,
  ) {}

  async findMyProfileSuggestions(userId: string) {
    const suggestions =
      await this.mentorProfileSuggestionsService.findSuggestions(userId);
    return this.mentorMapper.toProfileSuggestionsResponse(suggestions);
  }

  async findAll() {
    const now = new Date();
    const mentors = await this.mentorsRepository.findActiveMentors(now);

    return this.mentorMapper.toDirectoryResponseList(mentors);
  }

  async findDirectory(
    query: MentorDirectoryQuery,
    userId?: string,
  ): Promise<DirectoryPage> {
    const now = new Date();

    const filters = {
      search: query.search,
      area: query.area,
      orientation: query.orientation,
      available: query.available,
    };
    let affinityStatus: 'no_skills' | 'unmapped_skills' | undefined;

    if (query.sort === 'affinity') {
      if (!userId || !this.mentorAffinityService) {
        throw new Error(
          'Se requiere la identidad autenticada para calcular afinidad',
        );
      }

      const affinity = await this.mentorAffinityService.findUserAreaIds(userId);

      if (affinity.status === 'ready') {
        const candidates = await this.mentorsRepository.findDirectoryCandidates(
          filters,
          now,
        );
        const ranked = this.mentorAffinityService.rankMentors(
          candidates,
          affinity.areaIds,
        );
        const totalItems = ranked.length;
        const totalPages = Math.ceil(totalItems / DIRECTORY_PAGE_SIZE);
        const page = Math.min(query.page, Math.max(1, totalPages));
        const pageRanks = ranked.slice(
          (page - 1) * DIRECTORY_PAGE_SIZE,
          page * DIRECTORY_PAGE_SIZE,
        );
        const ids = pageRanks.map(({ id }) => id);
        const mentors = ids.length
          ? await this.mentorsRepository.findDirectoryByIds(ids, filters, now)
          : [];
        const mentorsById = new Map(
          mentors.map((mentor) => [mentor.id, mentor]),
        );

        return {
          items: pageRanks.flatMap(({ id, sharedInterestsCount }) => {
            const mentor = mentorsById.get(id);
            return mentor
              ? [
                  {
                    ...this.mentorMapper.toDirectoryResponse(mentor),
                    sharedInterestsCount,
                  },
                ]
              : [];
          }),
          page,
          pageSize: DIRECTORY_PAGE_SIZE,
          totalItems,
          totalPages,
          effectiveSort: 'affinity' as const,
          affinityStatus: 'ready' as const,
        };
      }

      affinityStatus = affinity.status;
    }

    const totalItems = await this.mentorsRepository.countDirectoryMentors(
      filters,
      now,
    );

    const totalPages = Math.ceil(totalItems / DIRECTORY_PAGE_SIZE);
    const page = Math.min(query.page, Math.max(1, totalPages));

    const mentors = totalItems
      ? await this.mentorsRepository.findDirectoryPage(
          filters,
          now,
          page,
          DIRECTORY_PAGE_SIZE,
          query.sort === 'affinity' ? 'default' : query.sort,
        )
      : [];

    return {
      items: this.mentorMapper.toDirectoryResponseList(mentors),
      page,
      pageSize: DIRECTORY_PAGE_SIZE,
      totalItems,
      totalPages,
      effectiveSort:
        query.sort === 'affinity' ? ('default' as const) : query.sort,
      ...(affinityStatus ? { affinityStatus } : {}),
    };
  }

  async findSimilar(userId: string) {
    const now = new Date();
    const source = await this.mentorsRepository.findSimilaritySource(
      userId,
      now,
    );
    if (!source) throw new MentorNotFoundException();

    const areaIds = new Set(
      source.mentorTechnicalAreas.map(({ technicalAreaId }) => technicalAreaId),
    );
    const orientationIds = new Set(
      source.mentorOrientationTypes.map(
        ({ orientationTypeId }) => orientationTypeId,
      ),
    );
    if (!areaIds.size && !orientationIds.size) return [];

    const candidates = await this.mentorsRepository.findSimilarCandidates(
      userId,
      [...areaIds],
      [...orientationIds],
      now,
    );
    const ranked = candidates.map((mentor) => ({
      id: mentor.id,
      areas: mentor.mentorTechnicalAreas.filter(({ technicalAreaId }) =>
        areaIds.has(technicalAreaId),
      ).length,
      orientations: mentor.mentorOrientationTypes.filter(
        ({ orientationTypeId }) => orientationIds.has(orientationTypeId),
      ).length,
    }));
    // El ID ascendente estabiliza empates sin depender del orden de Prisma.
    ranked.sort(
      (a, b) =>
        b.areas - a.areas ||
        b.orientations - a.orientations ||
        a.id.localeCompare(b.id),
    );
    const ids = ranked.slice(0, 3).map(({ id }) => id);
    if (!ids.length) return [];

    const mentors = await this.mentorsRepository.findDirectoryByIds(
      ids,
      { search: '', available: false },
      now,
    );
    const byId = new Map(mentors.map((mentor) => [mentor.id, mentor]));
    return ids.flatMap((id) => {
      const mentor = byId.get(id);
      return mentor ? [this.mentorMapper.toDirectoryResponse(mentor)] : [];
    });
  }

  async findOne(userId: string) {
    const now = new Date();
    const mentor = await this.mentorsRepository.findActiveMentorById(
      userId,
      now,
    );

    if (!mentor) {
      throw new MentorNotFoundException();
    }

    const skills = await this.userSkillService.getProfessionalSkills(userId);
    return this.mentorMapper.toProfileResponse(mentor, skills);
  }

  async findMyTechnicalAreas(userId: string) {
    await this.assertActiveMentor(userId);

    const relations =
      await this.mentorsRepository.findMentorTechnicalAreas(userId);

    return this.mentorMapper.toTechnicalAreasResponse(relations);
  }

  findMyParticipation(userId: string) {
    return this.mentorsRepository.findMyParticipation(userId);
  }

  async updateMyTechnicalAreas(
    userId: string,
    data: UpdateMentorTechnicalAreasDto,
  ) {
    await this.assertActiveMentor(userId);

    const technicalAreas = await this.mentorsRepository.findTechnicalAreas(
      data.technicalAreaIds,
    );

    if (technicalAreas.length !== data.technicalAreaIds.length) {
      throw new InvalidTechnicalAreasException();
    }

    await this.mentorsRepository.replaceMentorTechnicalAreas(
      userId,
      data.technicalAreaIds,
    );

    return { technicalAreaIds: data.technicalAreaIds };
  }

  async findMyOrientationTypes(userId: string) {
    await this.assertActiveMentor(userId);

    const relations =
      await this.mentorsRepository.findMentorOrientationTypes(userId);

    return this.mentorMapper.toOrientationTypesResponse(relations);
  }

  async updateMyOrientationTypes(
    userId: string,
    data: UpdateMentorOrientationTypesDto,
  ) {
    await this.assertActiveMentor(userId);

    const orientationTypes =
      await this.mentorsRepository.findActiveOrientationTypes(
        data.orientationTypeIds,
      );

    if (orientationTypes.length !== data.orientationTypeIds.length) {
      throw new InvalidOrientationTypesException();
    }

    await this.mentorsRepository.replaceMentorOrientationTypes(
      userId,
      data.orientationTypeIds,
    );

    return { orientationTypeIds: data.orientationTypeIds };
  }

  async activate(
    userId: string,
    data: ActivateMentorDto,
    key?: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ id: string }> {
    if (key)
      return withMentorIntake(
        this.mentorsRepository,
        userId,
        'ACTIVATE',
        key,
        data,
        (transaction) => this.activate(userId, data, undefined, transaction),
      );
    if (!data.technicalAreaIds.length)
      throw new InvalidTechnicalAreasException();
    if (!data.orientationTypeIds.length)
      throw new InvalidOrientationTypesException();
    if (!tx) {
      const result = await this.mentorsRepository.withLock(
        async (transaction) => {
          try {
            return await this.activate(userId, data, undefined, transaction);
          } catch (error) {
            if (error instanceof MentorParticipationException) return { error };
            throw error;
          }
        },
      );
      if ('error' in result) throw result.error;
      return result;
    }
    const mentorRole = await this.mentorsRepository.findMentorRole(tx);
    if (!mentorRole) {
      throw new MentorRoleNotFoundException();
    }

    const existingRole = await this.mentorsRepository.findActiveUserRole(
      userId,
      mentorRole.id,
      tx,
    );
    if (existingRole) {
      throw new AlreadyMentorException();
    }

    const technicalAreas = await this.mentorsRepository.findTechnicalAreas(
      data.technicalAreaIds,
      tx,
    );
    if (technicalAreas.length !== data.technicalAreaIds.length) {
      throw new InvalidTechnicalAreasException();
    }

    const orientationTypes =
      await this.mentorsRepository.findActiveOrientationTypes(
        data.orientationTypeIds,
        tx,
      );
    if (orientationTypes.length !== data.orientationTypeIds.length) {
      throw new InvalidOrientationTypesException();
    }

    await this.mentorsRepository.reconcileOffers(tx);
    const eligibility = await this.mentorsRepository.readEligibility(
      userId,
      tx,
    );
    if (!eligibility.eligible) throw new MentorEligibilityException();
    if (eligibility.alreadyMentor) throw new AlreadyMentorException();
    const intake = await this.mentorsRepository.readIntake(userId, tx);
    if (intake.hasOffer || intake.hasPendingRequest) {
      throw new MentorParticipationException(
        intake.hasOffer
          ? 'Ya tienes un cupo reservado. Confirma tu oferta desde Mi participación.'
          : 'Ya tienes una solicitud vigente. Revisa su estado en Mi participación.',
        409,
        {
          code: intake.hasOffer
            ? 'MENTOR_OFFER_CONFIRMATION_REQUIRED'
            : 'REQUEST_ALREADY_EXISTS',
          participationPath: '/mentors/participation',
        },
      );
    }
    const capacity = await this.mentorsRepository.readCapacity(tx);
    if (capacity.available < 1) throw new MentorCapacityException();

    const activation = await this.mentorsRepository.activate(
      userId,
      mentorRole.id,
      data.technicalAreaIds,
      data.orientationTypeIds,
      tx,
    );
    return activation;
  }

  async updateAvailability(userId: string, isAvailable: boolean) {
    await this.assertActiveMentor(userId);

    return this.mentorsRepository.updateAvailability(userId, isAvailable);
  }

  capacity() {
    return this.mentorsRepository.capacity();
  }

  private async assertActiveMentor(userId: string): Promise<void> {
    const mentor = await this.mentorsRepository.findActiveMentorParticipation(
      userId,
      new Date(),
    );

    if (!mentor) {
      throw new MentorNotFoundException();
    }
  }
}
