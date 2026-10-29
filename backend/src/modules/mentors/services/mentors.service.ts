import { withMentorIntake } from './mentor-intake.service.js';
import { Injectable } from '@nestjs/common';
import { MentorParticipationException } from '../exceptions/mentor-participation.exception.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import {
  AlreadyMentorException,
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
    private readonly mentorAffinityService?: MentorAffinityService,
  ) {}

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
          query.sort === 'affinity' ? 'name_asc' : query.sort,
        )
      : [];

    return {
      items: this.mentorMapper.toDirectoryResponseList(mentors),
      page,
      pageSize: DIRECTORY_PAGE_SIZE,
      totalItems,
      totalPages,
      effectiveSort:
        query.sort === 'affinity' ? ('name_asc' as const) : query.sort,
      ...(affinityStatus ? { affinityStatus } : {}),
    };
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

    return this.mentorMapper.toProfileResponse(mentor);
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
    const mentorRole = tx
      ? await this.mentorsRepository.findMentorRole(tx)
      : await this.mentorsRepository.findMentorRole();
    if (!mentorRole) {
      throw new MentorRoleNotFoundException();
    }

    const existingRole = tx
      ? await this.mentorsRepository.findActiveUserRole(
          userId,
          mentorRole.id,
          tx,
        )
      : await this.mentorsRepository.findActiveUserRole(userId, mentorRole.id);
    if (existingRole) {
      throw new AlreadyMentorException();
    }

    const technicalAreas = tx
      ? await this.mentorsRepository.findTechnicalAreas(
          data.technicalAreaIds,
          tx,
        )
      : await this.mentorsRepository.findTechnicalAreas(data.technicalAreaIds);
    if (technicalAreas.length !== data.technicalAreaIds.length) {
      throw new InvalidTechnicalAreasException();
    }

    const orientationTypes = tx
      ? await this.mentorsRepository.findActiveOrientationTypes(
          data.orientationTypeIds,
          tx,
        )
      : await this.mentorsRepository.findActiveOrientationTypes(
          data.orientationTypeIds,
        );
    if (orientationTypes.length !== data.orientationTypeIds.length) {
      throw new InvalidOrientationTypesException();
    }

    const activation = tx
      ? await this.mentorsRepository.activate(
          userId,
          mentorRole.id,
          data.technicalAreaIds,
          data.orientationTypeIds,
          tx,
        )
      : await this.mentorsRepository.activate(
          userId,
          mentorRole.id,
          data.technicalAreaIds,
          data.orientationTypeIds,
        );
    if ('result' in activation) {
      const hasOffer = activation.result === 'OFFER_EXISTS';
      throw new MentorParticipationException(
        hasOffer
          ? 'Ya tienes un cupo reservado. Confirma tu oferta desde Mi participación.'
          : 'Ya tienes una solicitud vigente. Revisa su estado en Mi participación.',
        409,
        {
          code: hasOffer
            ? 'MENTOR_OFFER_CONFIRMATION_REQUIRED'
            : 'REQUEST_ALREADY_EXISTS',
          participationPath: '/mentors/participation',
        },
      );
    }
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
