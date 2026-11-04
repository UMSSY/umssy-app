import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { directoryPredicate } from '../repositories/mentor-directory.queries.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';

describe('MentorsRepository directory page', () => {
  const now = new Date('2026-10-24T12:00:00.000Z');

  const filters = {
    search: 'Ana Rojas',
    area: 'Backend',
    orientation: 'Orientación técnica',
    available: true,
  };

  it('comparte predicado entre conteo, página, afinidad y selección por IDs', async () => {
    const raw = vi
      .fn()
      .mockResolvedValueOnce([{ total: 20n }])
      .mockResolvedValueOnce([{ id: 'b' }, { id: 'a' }])
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    const findMany = vi
      .fn()
      .mockResolvedValueOnce([{ id: 'a' }, { id: 'b' }])
      .mockResolvedValue([]);
    const repository = new MentorsRepository({
      $queryRaw: raw,
      user: { findMany },
    } as unknown as PrismaService);
    expect(await repository.countDirectoryMentors(filters, now)).toBe(20);
    expect(
      await repository.findDirectoryPage(filters, now, 4, 6, 'name_desc'),
    ).toEqual([
      { id: 'b', photoVersion: null },
      { id: 'a', photoVersion: null },
    ]);
    await repository.findDirectoryCandidates(filters, now);
    await repository.findDirectoryByIds(['b'], filters, now);
    const predicate = directoryPredicate(filters, now);
    for (const [query] of raw.mock.calls) {
      expect(query.sql).toContain(predicate.sql);
      expect(query.values.slice(0, predicate.values.length)).toEqual(
        predicate.values,
      );
    }
    expect(raw.mock.calls[1][0].sql).toContain(
      'u.first_name DESC, u.last_name DESC, u.id ASC',
    );
    expect(raw.mock.calls[1][0].values.slice(-2)).toEqual([6, 18]);
    expect(raw.mock.calls[3][0].sql).toContain('ANY(?::uuid[])');
    expect(findMany.mock.calls[0][0].select).not.toHaveProperty('photoUrl');
    expect(findMany.mock.calls[0][0].where).toMatchObject({
      isActive: true,
      isAvailableForMentoring: true,
    });
  });

  it('no hidrata una página sin coincidencias', async () => {
    const raw = vi.fn().mockResolvedValue([]);
    const findMany = vi.fn();
    const repository = new MentorsRepository({
      $queryRaw: raw,
      user: { findMany },
    } as unknown as PrismaService);
    expect(await repository.findDirectoryPage(filters, now, 1, 6)).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it('construye consultas independientes bajo concurrencia', async () => {
    const raw = vi.fn().mockResolvedValue([{ total: 0n }]);
    const repository = new MentorsRepository({
      $queryRaw: raw,
    } as unknown as PrismaService);
    expect(
      await Promise.all(
        Array.from({ length: 32 }, (_, index) =>
          repository.countDirectoryMentors(
            { search: 'u'.repeat(index % 2 ? 20 : 100), available: false },
            now,
          ),
        ),
      ),
    ).toEqual(Array(32).fill(0));
    for (const [query] of raw.mock.calls) {
      expect(query.sql.length).toBeLessThan(1500);
      expect(query.values.length).toBe(8);
    }
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
