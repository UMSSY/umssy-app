import type { DirectoryFilters } from '../types/directory-filters.types.js';
import type { MentorDirectorySort } from '../types/mentor-directory-sort.types.js';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../prisma/client.js';
import { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MENTOR_ROLE_NAME } from '../constants/mentor.constants.js';
import { MentorTransactionRepository } from './mentor-transaction.repository.js';
import { assignMentorParticipation } from './mentor-assignment.queries.js';

const directorySelect = {
  id: true,
  firstName: true,
  lastName: true,
  headline: true,
  isAvailableForMentoring: true,
  educations: {
    select: { degree: true, institution: true },
    orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    take: 1,
  },
  mentorOrientationTypes: {
    where: { orientationType: { isActive: true } },
    select: { orientationType: { select: { name: true } } },
    orderBy: { orientationType: { name: 'asc' } },
  },
  mentorTechnicalAreas: {
    select: { technicalArea: { select: { name: true } } },
  },
} satisfies Prisma.UserSelect;

@Injectable()
export class MentorsRepository extends MentorTransactionRepository {
  constructor(prisma: PrismaService) {
    super(prisma);
  }

  findMentorRole(tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).role.findUnique({
      where: {
        name: MENTOR_ROLE_NAME,
      },
      select: {
        id: true,
      },
    });
  }

  findActiveUserRole(
    userId: string,
    roleId: string,
    tx?: Prisma.TransactionClient,
  ) {
    return (tx ?? this.prisma).userRole.findFirst({
      where: {
        userId,
        roleId,
        deletedAt: null,
        startAt: { lte: new Date() },
      },
      select: {
        id: true,
      },
    });
  }

  findTechnicalAreas(ids: string[], tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).technicalArea.findMany({
      where: {
        id: {
          in: ids,
        },
      },
      select: {
        id: true,
      },
    });
  }

  findActiveOrientationTypes(ids: string[], tx?: Prisma.TransactionClient) {
    return (tx ?? this.prisma).orientationType.findMany({
      where: {
        id: {
          in: ids,
        },
        isActive: true,
      },
      select: {
        id: true,
      },
    });
  }

  async findActiveMentors(now: Date) {
    const mentors = await this.prisma.user.findMany({
      where: this.activeMentorWhere(now),
      select: directorySelect,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
    });

    return this.withPhotoVersions(mentors);
  }

  countDirectoryMentors(filters: DirectoryFilters, now: Date) {
    return this.prisma.user.count({
      where: this.directoryWhere(filters, now),
    });
  }

  findUserSkills(userId: string) {
    return this.prisma.userSkill.findMany({
      where: { userId },
      select: { skill: { select: { name: true, isCustom: true } } },
    });
  }

  findTechnicalAreasByNames(names: string[]) {
    return this.prisma.technicalArea.findMany({
      where: { name: { in: names } },
      select: { id: true, name: true },
    });
  }

  findDirectoryCandidates(filters: DirectoryFilters, now: Date) {
    return this.prisma.user.findMany({
      where: this.directoryWhere(filters, now),
      select: {
        id: true,
        firstName: true,
        lastName: true,
        mentorTechnicalAreas: { select: { technicalAreaId: true } },
      },
    });
  }

  async findDirectoryByIds(
    ids: string[],
    filters: DirectoryFilters,
    now: Date,
  ) {
    const mentors = await this.prisma.user.findMany({
      where: { ...this.directoryWhere(filters, now), id: { in: ids } },
      select: directorySelect,
    });

    return this.withPhotoVersions(mentors);
  }

  async findDirectoryPage(
    filters: DirectoryFilters,
    now: Date,
    page: number,
    pageSize: number,
    sort: MentorDirectorySort = 'name_asc',
  ) {
    const direction = sort === 'name_desc' ? 'desc' : 'asc';

    const mentors = await this.prisma.user.findMany({
      where: this.directoryWhere(filters, now),
      select: directorySelect,
      orderBy: [
        { firstName: direction },
        { lastName: direction },
        { id: 'asc' },
      ],
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return this.withPhotoVersions(mentors);
  }

  private activeMentorWhere(now: Date): Prisma.UserWhereInput {
    return {
      isActive: true,
      roles: {
        some: {
          deletedAt: null,
          startAt: { lte: now },
          role: { name: MENTOR_ROLE_NAME },
        },
      },
    };
  }

  private directoryWhere(
    filters: DirectoryFilters,
    now: Date,
  ): Prisma.UserWhereInput {
    const where = this.activeMentorWhere(now);

    if (filters.available) {
      where.isAvailableForMentoring = true;
    }

    if (filters.area) {
      where.mentorTechnicalAreas = {
        some: { technicalArea: { name: filters.area } },
      };
    }

    if (filters.orientation) {
      where.mentorOrientationTypes = {
        some: {
          orientationType: {
            name: filters.orientation,
            isActive: true,
          },
        },
      };
    }

    if (filters.search) {
      where.AND = filters.search.split(/\s+/).map((word) => ({
        OR: [
          { firstName: { contains: word, mode: 'insensitive' } },
          { lastName: { contains: word, mode: 'insensitive' } },
        ],
      }));
    }

    return where;
  }

  private async withPhotoVersions<T extends { id: string }>(mentors: T[]) {
    const photos = mentors.length
      ? await this.prisma.user.findMany({
          where: {
            id: { in: mentors.map((mentor) => mentor.id) },
            photoUrl: { not: null },
            NOT: { photoUrl: new Uint8Array() },
          },
          select: { id: true, updatedAt: true },
        })
      : [];

    const photoVersions = new Map(
      photos.map((photo) => [photo.id, photo.updatedAt.toISOString()]),
    );

    return mentors.map((mentor) => ({
      ...mentor,
      photoVersion: photoVersions.get(mentor.id) ?? null,
    }));
  }

  findActiveMentorParticipation(userId: string, now: Date) {
    return this.prisma.user.findFirst({
      where: {
        ...this.activeMentorWhere(now),
        id: userId,
      },
      select: {
        id: true,
      },
    });
  }

  async findMyParticipation(userId: string) {
    const [roles, areas, orientations] = await Promise.all([
      this.prisma.userRole.findMany({
        where: { userId, role: { name: MENTOR_ROLE_NAME } },
        select: { deletedAt: true, startAt: true },
      }),
      this.findMentorTechnicalAreas(userId),
      this.findMentorOrientationTypes(userId),
    ]);
    const now = new Date();
    const isActive = roles.some(
      (role) => role.deletedAt === null && role.startAt <= now,
    );
    return {
      status: isActive
        ? ('ACTIVE' as const)
        : roles.length > 0
          ? ('DEACTIVATED' as const)
          : ('NEVER' as const),
      areas: areas.map(({ technicalArea }) => technicalArea),
      orientations: orientations.map(({ orientationType }) => orientationType),
    };
  }

  findMentorTechnicalAreas(userId: string) {
    return this.prisma.mentorTechnicalArea.findMany({
      where: {
        mentorId: userId,
      },
      select: {
        technicalArea: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        technicalArea: {
          name: 'asc',
        },
      },
    });
  }

  findMentorOrientationTypes(userId: string) {
    return this.prisma.mentorOrientationType.findMany({
      where: {
        mentorId: userId,
        orientationType: {
          isActive: true,
        },
      },
      select: {
        orientationType: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: {
        orientationType: {
          name: 'asc',
        },
      },
    });
  }

  findActiveMentorById(userId: string, now: Date) {
    return this.prisma.user.findFirst({
      where: {
        ...this.activeMentorWhere(now),
        id: userId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        headline: true,
        aboutMe: true,
        isAvailableForMentoring: true,
        photoUrl: true,
        city: {
          select: {
            id: true,
            title: true,
          },
        },
        educations: {
          select: {
            id: true,
            institution: true,
            degree: true,
            startDate: true,
            endDate: true,
            description: true,
          },
          orderBy: {
            startDate: 'desc',
          },
        },
        workExperiences: {
          select: {
            id: true,
            position: true,
            startDate: true,
            endDate: true,
            isCurrent: true,
            description: true,
            company: {
              select: {
                id: true,
                title: true,
              },
            },
          },
          orderBy: [{ isCurrent: 'desc' }, { startDate: 'desc' }],
        },
        userSkills: {
          select: {
            skill: {
              select: {
                id: true,
                name: true,
                isCustom: true,
              },
            },
          },
          orderBy: {
            skill: {
              name: 'asc',
            },
          },
        },
        certifications: {
          select: {
            id: true,
            name: true,
            issuingOrganization: true,
            issueDate: true,
            documentUrl: true,
          },
          orderBy: {
            issueDate: 'desc',
          },
        },
        mentorTechnicalAreas: {
          select: {
            technicalArea: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            technicalArea: {
              name: 'asc',
            },
          },
        },
        mentorOrientationTypes: {
          where: {
            orientationType: {
              isActive: true,
            },
          },
          select: {
            orientationType: {
              select: {
                id: true,
                name: true,
                description: true,
              },
            },
          },
          orderBy: {
            orientationType: {
              name: 'asc',
            },
          },
        },
      },
    });
  }

  capacity() {
    return this.capacityCounts();
  }

  activate(
    userId: string,
    roleId: string,
    technicalAreaIds: string[],
    orientationTypeIds: string[],
    tx?: Prisma.TransactionClient,
  ) {
    const write = (transaction: Prisma.TransactionClient) =>
      assignMentorParticipation(
        transaction,
        userId,
        roleId,
        technicalAreaIds,
        orientationTypeIds,
      );
    return tx ? write(tx) : this.withLock(write);
  }

  updateAvailability(userId: string, isAvailable: boolean) {
    return this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        isAvailableForMentoring: isAvailable,
      },
      select: {
        id: true,
        isAvailableForMentoring: true,
      },
    });
  }

  replaceMentorTechnicalAreas(userId: string, technicalAreaIds: string[]) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.mentorTechnicalArea.deleteMany({
        where: {
          mentorId: userId,
        },
      });

      await transaction.mentorTechnicalArea.createMany({
        data: technicalAreaIds.map((technicalAreaId) => ({
          mentorId: userId,
          technicalAreaId,
        })),
      });
    });
  }

  replaceMentorOrientationTypes(userId: string, orientationTypeIds: string[]) {
    return this.prisma.$transaction(async (transaction) => {
      await transaction.mentorOrientationType.deleteMany({
        where: {
          mentorId: userId,
        },
      });

      await transaction.mentorOrientationType.createMany({
        data: orientationTypeIds.map((orientationTypeId) => ({
          mentorId: userId,
          orientationTypeId,
        })),
      });
    });
  }
}
