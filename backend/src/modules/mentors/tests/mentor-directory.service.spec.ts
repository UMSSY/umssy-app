import { describe, expect, it, vi } from 'vitest';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import { MentorsService } from '../services/mentors.service.js';
import type { MentorDirectoryQuery } from '../requests/mentor-directory-query.schema.js';
import type { MentorAffinityService } from '../services/mentor-affinity.service.js';

describe('MentorsService directory pagination', () => {
  const baseQuery: MentorDirectoryQuery = {
    page: 1,
    search: '',
    available: false,
    sort: 'name_asc',
  };

  const mentor = (id: number) => ({
    id: `mentor-${id}`,
    firstName: 'Ana',
    lastName: `Rojas ${id}`,
    headline: null,
    photoVersion: null,
    educations: [],
    isAvailableForMentoring: false,
    mentorOrientationTypes: [],
    mentorTechnicalAreas: [],
  });

  function makeService(totalItems: number) {
    const countDirectoryMentors = vi.fn().mockResolvedValue(totalItems);

    const findDirectoryPage = vi
      .fn()
      .mockImplementation(
        async (
          _filters: unknown,
          _now: Date,
          page: number,
          pageSize: number,
          _sort?: string,
        ) =>
          Array.from(
            {
              length: Math.min(
                pageSize,
                Math.max(0, totalItems - (page - 1) * pageSize),
              ),
            },
            (_, index) => mentor((page - 1) * pageSize + index + 1),
          ),
      );

    const findActiveMentors = vi.fn().mockResolvedValue([mentor(1)]);

    const repository = {
      countDirectoryMentors,
      findDirectoryPage,
      findActiveMentors,
    } as unknown as MentorsRepository;

    return {
      service: new MentorsService(repository, new MentorMapper()),
      countDirectoryMentors,
      findDirectoryPage,
      findActiveMentors,
    };
  }

  it.each([
    { total: 18, pages: 3, counts: [6, 6, 6] },
    { total: 20, pages: 4, counts: [6, 6, 6, 2] },
  ])(
    'pagina $total mentores sin repetir IDs',
    async ({ total, pages, counts }) => {
      const { service, findDirectoryPage } = makeService(total);
      const ids: string[] = [];

      for (let page = 1; page <= pages; page++) {
        const result = await service.findDirectory({
          ...baseQuery,
          page,
        });

        expect(result).toMatchObject({
          page,
          pageSize: 6,
          totalItems: total,
          totalPages: pages,
          effectiveSort: 'name_asc',
        });

        expect(result.items).toHaveLength(counts[page - 1]);
        ids.push(...result.items.map((item) => item.id));
      }

      expect(ids).toHaveLength(total);
      expect(new Set(ids).size).toBe(total);
      expect(findDirectoryPage).toHaveBeenCalledTimes(pages);
    },
  );

  it('normaliza una página excesiva a la última y el vacío a página 1', async () => {
    const populated = makeService(20);

    expect(
      (
        await populated.service.findDirectory({
          ...baseQuery,
          page: 99,
        })
      ).page,
    ).toBe(4);

    expect(populated.findDirectoryPage.mock.calls[0]?.[2]).toBe(4);

    const empty = makeService(0);

    expect(
      await empty.service.findDirectory({
        ...baseQuery,
        page: 99,
      }),
    ).toEqual({
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
      effectiveSort: 'name_asc',
    });

    expect(empty.findDirectoryPage).not.toHaveBeenCalled();
  });

  it('transmite orientation junto con los demás filtros y conserva la paginación', async () => {
    const { service, countDirectoryMentors, findDirectoryPage } =
      makeService(7);

    const result = await service.findDirectory({
      ...baseQuery,
      page: 2,
      search: 'Ana',
      area: 'Backend',
      orientation: 'Orientación técnica',
      available: true,
    });

    const expectedFilters = {
      search: 'Ana',
      area: 'Backend',
      orientation: 'Orientación técnica',
      available: true,
    };

    expect(countDirectoryMentors).toHaveBeenCalledWith(
      expectedFilters,
      expect.any(Date),
    );

    expect(findDirectoryPage).toHaveBeenCalledWith(
      expectedFilters,
      expect.any(Date),
      2,
      6,
      'name_asc',
    );

    expect(result).toMatchObject({
      page: 2,
      pageSize: 6,
      totalItems: 7,
      totalPages: 2,
    });
  });

  it('devuelve cero resultados para una orientación inexistente', async () => {
    const { service, countDirectoryMentors, findDirectoryPage } =
      makeService(0);

    const result = await service.findDirectory({
      ...baseQuery,
      orientation: 'Orientación inexistente',
    });

    expect(countDirectoryMentors).toHaveBeenCalledWith(
      {
        search: '',
        area: undefined,
        orientation: 'Orientación inexistente',
        available: false,
      },
      expect.any(Date),
    );

    expect(result).toMatchObject({
      items: [],
      page: 1,
      pageSize: 6,
      totalItems: 0,
      totalPages: 0,
    });

    expect(findDirectoryPage).not.toHaveBeenCalled();
  });

  it('acepta Z-A y transmite el orden al repositorio', async () => {
    const { service, findDirectoryPage } = makeService(18);

    const result = await service.findDirectory({
      ...baseQuery,
      sort: 'name_desc',
    });

    expect(result.effectiveSort).toBe('name_desc');

    expect(findDirectoryPage).toHaveBeenCalledWith(
      {
        search: '',
        area: undefined,
        orientation: undefined,
        available: false,
      },
      expect.any(Date),
      1,
      6,
      'name_desc',
    );
  });

  it('conserva todos los IDs al recorrer las páginas en orden Z-A', async () => {
    const totalItems = 14;

    const allMentors = Array.from({ length: totalItems }, (_, index) => ({
      ...mentor(index + 1),
      firstName: `Nombre${String(totalItems - index).padStart(2, '0')}`,
      lastName: 'Apellido',
    }));

    const expected = [...allMentors].sort(
      (a, b) =>
        b.firstName.localeCompare(a.firstName) ||
        b.lastName.localeCompare(a.lastName) ||
        a.id.localeCompare(b.id),
    );

    const countDirectoryMentors = vi.fn().mockResolvedValue(totalItems);

    const findDirectoryPage = vi
      .fn()
      .mockImplementation(
        async (
          _filters: unknown,
          _now: Date,
          page: number,
          pageSize: number,
          sort?: string,
        ) => {
          if (sort !== 'name_desc') {
            throw new Error('Se esperaba el orden name_desc');
          }

          return expected.slice((page - 1) * pageSize, page * pageSize);
        },
      );

    const repository = {
      countDirectoryMentors,
      findDirectoryPage,
      findActiveMentors: vi.fn().mockResolvedValue([]),
    } as unknown as MentorsRepository;

    const service = new MentorsService(repository, new MentorMapper());
    const received: Array<{ id: string; fullName: string }> = [];
    const totalPages = Math.ceil(totalItems / 6);

    for (let page = 1; page <= totalPages; page++) {
      const result = await service.findDirectory({
        ...baseQuery,
        page,
        sort: 'name_desc',
      });

      expect(result.effectiveSort).toBe('name_desc');
      received.push(...result.items);
    }

    const receivedIds = received.map((item) => item.id);

    expect(receivedIds).toHaveLength(totalItems);
    expect(new Set(receivedIds).size).toBe(totalItems);
    expect(receivedIds).toEqual(expected.map((item) => item.id));

    expect(findDirectoryPage).toHaveBeenCalledTimes(totalPages);
  });

  it('conserva los IDs sin duplicados ni omisiones con nombres y apellidos repetidos en Z-A', async () => {
    const allMentors = [
      { ...mentor(1), firstName: 'Ana', lastName: 'Rojas' },
      { ...mentor(2), firstName: 'Ana', lastName: 'Rojas' },
      { ...mentor(3), firstName: 'Ana', lastName: 'Vargas' },
      { ...mentor(4), firstName: 'Luis', lastName: 'Rojas' },
      { ...mentor(5), firstName: 'Luis', lastName: 'Rojas' },
      { ...mentor(6), firstName: 'Luis', lastName: 'Vargas' },
      { ...mentor(7), firstName: 'Maria', lastName: 'Rojas' },
      { ...mentor(8), firstName: 'Maria', lastName: 'Rojas' },
      { ...mentor(9), firstName: 'Maria', lastName: 'Vargas' },
      { ...mentor(10), firstName: 'Pedro', lastName: 'Rojas' },
      { ...mentor(11), firstName: 'Pedro', lastName: 'Rojas' },
      { ...mentor(12), firstName: 'Pedro', lastName: 'Vargas' },
      { ...mentor(13), firstName: 'Sofia', lastName: 'Rojas' },
      { ...mentor(14), firstName: 'Sofia', lastName: 'Rojas' },
    ];

    const expected = [...allMentors].sort(
      (a, b) =>
        b.firstName.localeCompare(a.firstName) ||
        b.lastName.localeCompare(a.lastName) ||
        a.id.localeCompare(b.id),
    );

    const countDirectoryMentors = vi.fn().mockResolvedValue(allMentors.length);

    const findDirectoryPage = vi
      .fn()
      .mockImplementation(
        async (
          _filters: unknown,
          _now: Date,
          page: number,
          pageSize: number,
          sort?: string,
        ) => {
          if (sort !== 'name_desc') {
            throw new Error('Se esperaba el orden name_desc');
          }

          return expected.slice((page - 1) * pageSize, page * pageSize);
        },
      );

    const repository = {
      countDirectoryMentors,
      findDirectoryPage,
      findActiveMentors: vi.fn().mockResolvedValue([]),
    } as unknown as MentorsRepository;

    const service = new MentorsService(repository, new MentorMapper());
    const received: Array<{ id: string; fullName: string }> = [];
    const totalPages = Math.ceil(allMentors.length / 6);

    for (let page = 1; page <= totalPages; page++) {
      const result = await service.findDirectory({
        ...baseQuery,
        page,
        sort: 'name_desc',
      });

      received.push(...result.items);
    }

    const receivedIds = received.map((item) => item.id);

    expect(received).toHaveLength(allMentors.length);
    expect(receivedIds).toHaveLength(allMentors.length);
    expect(new Set(receivedIds).size).toBe(allMentors.length);

    expect(receivedIds).toEqual(expected.map((item) => item.id));

    expect(receivedIds).toEqual(
      expect.arrayContaining(allMentors.map((item) => item.id)),
    );

    expect(findDirectoryPage).toHaveBeenCalledTimes(totalPages);
  });

  it('requiere identidad autenticada para solicitar afinidad', async () => {
    const { service, countDirectoryMentors } = makeService(18);

    await expect(
      service.findDirectory({
        ...baseQuery,
        sort: 'affinity',
      }),
    ).rejects.toThrow('Se requiere la identidad autenticada');

    expect(countDirectoryMentors).not.toHaveBeenCalled();
  });

  it.each([
    { status: 'no_skills' as const },
    { status: 'unmapped_skills' as const },
  ])(
    'conserva A–Z, filtros y mentores sin conteos para $status',
    async ({ status }) => {
      const context = makeService(7);
      const affinity = {
        findUserAreaIds: vi
          .fn()
          .mockResolvedValue({ status, areaIds: new Set() }),
      } as unknown as MentorAffinityService;
      const repository = {
        countDirectoryMentors: context.countDirectoryMentors,
        findDirectoryPage: context.findDirectoryPage,
      } as unknown as MentorsRepository;
      const service = new MentorsService(
        repository,
        new MentorMapper(),
        affinity,
      );
      const result = await service.findDirectory(
        {
          ...baseQuery,
          page: 2,
          search: 'Ana',
          area: 'Backend',
          orientation: undefined,
          available: true,
          sort: 'affinity',
        },
        'session-user',
      );

      expect(result).toMatchObject({
        page: 2,
        totalItems: 7,
        totalPages: 2,
        effectiveSort: 'name_asc',
        affinityStatus: status,
      });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]).not.toHaveProperty('sharedInterestsCount');
      expect(context.findDirectoryPage).toHaveBeenCalledWith(
        {
          search: 'Ana',
          area: 'Backend',
          available: true,
        },
        expect.any(Date),
        2,
        6,
        'name_asc',
      );
      expect(affinity.findUserAreaIds).toHaveBeenCalledWith('session-user');
    },
  );

  it('mantiene findAll() y el mapper existente', async () => {
    const { service, findActiveMentors } = makeService(1);

    expect(await service.findAll()).toMatchObject([
      { id: 'mentor-1', fullName: 'Ana Rojas 1' },
    ]);

    expect(findActiveMentors).toHaveBeenCalledTimes(1);
  });
});
