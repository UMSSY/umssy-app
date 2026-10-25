import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MENTOR_ROLE_NAME } from '../constants/mentor.constants.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';

describe('MentorsRepository directory page', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');
  const filters = { search: 'Ana Rojas', area: 'Backend', available: true };

  it('usa exactamente los mismos filtros en count y página, y pagina tras ordenar', async () => {
    const count = vi.fn().mockResolvedValue(20);
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'mentor-19' }])
      .mockResolvedValueOnce([]);
    const repository = new MentorsRepository({
      user: { count, findMany },
    } as unknown as PrismaService);

    expect(await repository.countDirectoryMentors(filters, now)).toBe(20);
    expect(await repository.findDirectoryPage(filters, now, 4, 6)).toEqual([
      { id: 'mentor-19', photoVersion: null },
    ]);

    const where = count.mock.calls[0]?.[0].where;
    expect(findMany.mock.calls[0]?.[0].where).toEqual(where);
    expect(where).toMatchObject({
      isActive: true,
      isAvailableForMentoring: true,
      roles: {
        some: {
          deletedAt: null,
          startAt: { lte: now },
          role: { name: MENTOR_ROLE_NAME },
        },
      },
      mentorTechnicalAreas: { some: { technicalArea: { name: 'Backend' } } },
    });
    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toContainEqual({
      firstName: { contains: 'Ana', mode: 'insensitive' },
    });
    expect(where.AND[1].OR).toContainEqual({
      lastName: { contains: 'Rojas', mode: 'insensitive' },
    });
    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
      skip: 18,
      take: 6,
    });
    expect(findMany.mock.calls[0]?.[0].select).not.toHaveProperty('photoUrl');
    expect(findMany.mock.calls[1]?.[0].select).toEqual({
      id: true,
      updatedAt: true,
    });
  });

  it('omite filtros opcionales y no consulta fotos para página vacía', async () => {
    const findMany = vi.fn().mockResolvedValue([]);
    const repository = new MentorsRepository({
      user: { findMany },
    } as unknown as PrismaService);
    expect(
      await repository.findDirectoryPage(
        { search: '', available: false },
        now,
        1,
        6,
      ),
    ).toEqual([]);
    expect(findMany).toHaveBeenCalledTimes(1);
    const where = findMany.mock.calls[0]?.[0].where;
    expect(where).not.toHaveProperty('AND');
    expect(where).not.toHaveProperty('mentorTechnicalAreas');
    expect(where).not.toHaveProperty('isAvailableForMentoring');
  });
});
