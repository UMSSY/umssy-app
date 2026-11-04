import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MENTOR_ROLE_NAME } from '../constants/mentor.constants.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';

describe('MentorsRepository directory page', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');

  const filters = {
    search: 'Ana Rojas',
    area: 'Backend',
    orientation: 'Orientación técnica',
    available: true,
  };

  it('usa los mismos filtros en count y página, y pagina tras ordenar', async () => {
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
      mentorTechnicalAreas: {
        some: {
          technicalArea: { name: 'Backend' },
        },
      },
      mentorOrientationTypes: {
        some: {
          orientationType: {
            name: 'Orientación técnica',
            isActive: true,
          },
        },
      },
    });

    expect(where.AND).toHaveLength(2);

    expect(where.AND[0].OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'ana', mode: 'insensitive' } },
        { lastName: { contains: 'ana', mode: 'insensitive' } },
      ]),
    );

    expect(where.AND[1].OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'rojas', mode: 'insensitive' } },
        { lastName: { contains: 'rojas', mode: 'insensitive' } },
      ]),
    );

    expect(findMany.mock.calls[0]?.[0]).toMatchObject({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      skip: 18,
      take: 6,
    });

    expect(findMany.mock.calls[0]?.[0].select).not.toHaveProperty('photoUrl');

    expect(findMany.mock.calls[1]?.[0].select).toEqual({
      id: true,
      updatedAt: true,
    });
  });

  it('busca varias palabras en cualquier orden solo entre nombre y apellido', async () => {
    const count = vi.fn().mockResolvedValue(1);

    const repository = new MentorsRepository({
      user: { count },
    } as unknown as PrismaService);

    await repository.countDirectoryMentors(
      { search: 'Rojas Ana', available: false },
      now,
    );

    const where = count.mock.calls[0]?.[0].where;

    expect(where.AND).toHaveLength(2);
    expect(where.AND[0].OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'rojas', mode: 'insensitive' } },
        { lastName: { contains: 'rojas', mode: 'insensitive' } },
      ]),
    );
    expect(where.AND[1].OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'ana', mode: 'insensitive' } },
        { lastName: { contains: 'ana', mode: 'insensitive' } },
      ]),
    );
  });

  it('genera variantes con y sin tilde para la búsqueda por nombre', async () => {
    const count = vi.fn().mockResolvedValue(1);

    const repository = new MentorsRepository({
      user: { count },
    } as unknown as PrismaService);

    await repository.countDirectoryMentors(
      { search: 'andres', available: false },
      now,
    );

    const searchConditions = count.mock.calls[0]?.[0].where.AND;
    const serialized = JSON.stringify(searchConditions);

    expect(serialized).toContain('andres');
    expect(serialized).toContain('andrés');
  });

  it('no incluye titular profesional ni áreas técnicas dentro de search', async () => {
    const count = vi.fn().mockResolvedValue(0);

    const repository = new MentorsRepository({
      user: { count },
    } as unknown as PrismaService);

    await repository.countDirectoryMentors(
      {
        search: 'Backend',
        available: false,
      },
      now,
    );

    const searchConditions = count.mock.calls[0]?.[0].where.AND;

    expect(searchConditions).toHaveLength(1);
    expect(searchConditions[0].OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'backend', mode: 'insensitive' } },
        { lastName: { contains: 'backend', mode: 'insensitive' } },
      ]),
    );

    expect(JSON.stringify(searchConditions)).not.toContain('headline');
    expect(JSON.stringify(searchConditions)).not.toContain(
      'mentorTechnicalAreas',
    );
  });

  it('ordena Z-A antes de paginar y desempata por ID ascendente', async () => {
    const findMany = vi.fn().mockResolvedValue([]);

    const repository = new MentorsRepository({
      user: { findMany },
    } as unknown as PrismaService);

    await repository.findDirectoryPage(
      { search: '', available: false },
      now,
      2,
      6,
      'name_desc',
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ firstName: 'desc' }, { lastName: 'desc' }, { id: 'asc' }],
        skip: 6,
        take: 6,
      }),
    );
  });

  it('ordena A-Z antes de paginar y conserva el desempate por ID', async () => {
    const findMany = vi.fn().mockResolvedValue([]);

    const repository = new MentorsRepository({
      user: { findMany },
    } as unknown as PrismaService);

    await repository.findDirectoryPage(
      { search: '', available: false },
      now,
      1,
      6,
      'name_asc',
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 6,
      }),
    );
  });

  it('ordena los candidatos de afinidad por el orden general estable', async () => {
    const findMany = vi.fn().mockResolvedValue([]);

    const repository = new MentorsRepository({
      user: { findMany },
    } as unknown as PrismaService);

    await repository.findDirectoryCandidates(
      { search: '', available: false },
      now,
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        select: expect.objectContaining({ createdAt: true }),
      }),
    );
  });

  it('usa el ID ascendente para desempatar nombres y apellidos repetidos en Z-A', async () => {
    const findMany = vi.fn().mockResolvedValue([]);

    const repository = new MentorsRepository({
      user: { findMany },
    } as unknown as PrismaService);

    await repository.findDirectoryPage(
      { search: '', available: false },
      now,
      1,
      2,
      'name_desc',
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ firstName: 'desc' }, { lastName: 'desc' }, { id: 'asc' }],
        skip: 0,
        take: 2,
      }),
    );
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
    expect(where).not.toHaveProperty('mentorOrientationTypes');
    expect(where).not.toHaveProperty('isAvailableForMentoring');
  });
});
