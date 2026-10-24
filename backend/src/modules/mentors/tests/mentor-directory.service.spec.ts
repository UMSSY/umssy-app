import { describe, expect, it, vi } from 'vitest';
import type { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import { MentorsService } from '../services/mentors.service.js';
import type { MentorDirectoryQuery } from '../requests/mentor-directory-query.schema.js';

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
        async (_filters, _now, page: number, pageSize: number) =>
          Array.from(
            { length: Math.min(pageSize, totalItems - (page - 1) * pageSize) },
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
        const result = await service.findDirectory({ ...baseQuery, page });
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
      expect(new Set(ids).size).toBe(total);
      expect(findDirectoryPage).toHaveBeenCalledTimes(pages);
    },
  );

  it('normaliza una página excesiva a la última y el vacío a página 1', async () => {
    const populated = makeService(20);
    expect(
      (await populated.service.findDirectory({ ...baseQuery, page: 99 })).page,
    ).toBe(4);
    expect(populated.findDirectoryPage.mock.calls[0]?.[2]).toBe(4);
    const empty = makeService(0);
    expect(
      await empty.service.findDirectory({ ...baseQuery, page: 99 }),
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

  it('rechaza los órdenes reservados sin hacer una consulta ni fingir afinidad', async () => {
    const { service, countDirectoryMentors } = makeService(18);
    for (const sort of ['name_desc', 'affinity'] as const) {
      await expect(
        service.findDirectory({ ...baseQuery, sort }),
      ).rejects.toMatchObject({ statusCode: 400 });
    }
    expect(countDirectoryMentors).not.toHaveBeenCalled();
  });

  it('mantiene findAll() y el mapper existente', async () => {
    const { service, findActiveMentors } = makeService(1);
    expect(await service.findAll()).toMatchObject([
      { id: 'mentor-1', fullName: 'Ana Rojas 1' },
    ]);
    expect(findActiveMentors).toHaveBeenCalledTimes(1);
  });
});
