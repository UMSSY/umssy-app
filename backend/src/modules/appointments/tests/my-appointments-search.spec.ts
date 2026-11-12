import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import {
  ACCENTED_SEARCH_CHARACTERS,
  UNACCENTED_SEARCH_CHARACTERS,
} from '../constants/my-appointments-search.constants.js';
import type { AppointmentMapper } from '../mappers/appointment.mapper.js';
import { AppointmentsRepository } from '../repositories/appointments.repository.js';
import { AppointmentsService } from '../services/appointments.service.js';
import {
  MENTOR_ID,
  NOW,
  OTHER_USER_ID,
  STUDENT_ID,
} from './fixtures/appointment-record.fixture.js';

describe('My appointments search by counterpart name', () => {
  describe('AppointmentsRepository', () => {
    const queryRaw = vi.fn();
    const findMany = vi.fn();
    const count = vi.fn();
    let repository: AppointmentsRepository;

    beforeEach(() => {
      vi.resetAllMocks();
      repository = new AppointmentsRepository({
        $queryRaw: queryRaw,
        appointment: { findMany, count },
      } as unknown as PrismaService);
    });

    it('returns the ids of the counterparts whose name matches', async () => {
      queryRaw.mockResolvedValue([{ id: STUDENT_ID }, { id: OTHER_USER_ID }]);

      await expect(
        repository.findCounterpartIdsByName(MENTOR_ID, 'maria'),
      ).resolves.toEqual([STUDENT_ID, OTHER_USER_ID]);
    });

    it('scopes the lookup to the appointments of the session user and ignores accents in stored names', async () => {
      queryRaw.mockResolvedValue([]);

      await repository.findCounterpartIdsByName(MENTOR_ID, 'jose');

      const [strings, ...values] = queryRaw.mock.calls[0] as [
        TemplateStringsArray,
        ...unknown[],
      ];
      const sql = strings.join('?');
      expect(sql).toContain('FROM appointments a');
      expect(sql).toContain('a.mentor_id = ?::uuid OR a.student_id = ?::uuid');
      expect(sql).toContain("lower(u.first_name || ' ' || u.last_name)");
      expect(values).toEqual([
        MENTOR_ID,
        MENTOR_ID,
        MENTOR_ID,
        ACCENTED_SEARCH_CHARACTERS,
        UNACCENTED_SEARCH_CHARACTERS,
        '%jose%',
      ]);
    });

    it('treats LIKE wildcards in the search text as plain characters', async () => {
      queryRaw.mockResolvedValue([]);

      await repository.findCounterpartIdsByName(MENTOR_ID, '50%_a\\b');

      expect(queryRaw.mock.calls[0]?.at(-1)).toBe('%50\\%\\_a\\\\b%');
    });

    it('keeps both accent maps aligned character by character', () => {
      expect(ACCENTED_SEARCH_CHARACTERS).toHaveLength(
        UNACCENTED_SEARCH_CHARACTERS.length,
      );
    });

    it('pairs the session user with the matching counterparts in both roles', async () => {
      count.mockResolvedValue(2);

      await repository.countMine(MENTOR_ID, 'upcoming', NOW, [STUDENT_ID]);

      expect(count).toHaveBeenCalledExactlyOnceWith({
        where: expect.objectContaining({
          OR: [
            { mentorId: MENTOR_ID, studentId: { in: [STUDENT_ID] } },
            { studentId: MENTOR_ID, mentorId: { in: [STUDENT_ID] } },
          ],
        }) as unknown,
      });
    });

    it('applies the same pairing to the page query', async () => {
      findMany.mockResolvedValue([]);

      await repository.findMine(MENTOR_ID, 'past', NOW, 1, 10, [STUDENT_ID]);

      expect(findMany).toHaveBeenCalledExactlyOnceWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { mentorId: MENTOR_ID, studentId: { in: [STUDENT_ID] } },
              { studentId: MENTOR_ID, mentorId: { in: [STUDENT_ID] } },
            ],
            endAt: { lte: NOW },
          }) as unknown,
        }),
      );
    });

    it('matches nothing when no counterpart matches', async () => {
      count.mockResolvedValue(0);

      await repository.countMine(MENTOR_ID, 'upcoming', NOW, []);

      expect(count).toHaveBeenCalledExactlyOnceWith({
        where: expect.objectContaining({
          OR: [
            { mentorId: MENTOR_ID, studentId: { in: [] } },
            { studentId: MENTOR_ID, mentorId: { in: [] } },
          ],
        }) as unknown,
      });
    });
  });

  describe('AppointmentsService', () => {
    const repository = {
      findCounterpartIdsByName: vi.fn(),
      countMine: vi.fn(),
      findMine: vi.fn(),
    };
    const mapper = { toResponseList: vi.fn() };
    let service: AppointmentsService;

    beforeEach(() => {
      vi.resetAllMocks();
      mapper.toResponseList.mockReturnValue([]);
      repository.findMine.mockResolvedValue([]);
      service = new AppointmentsService(
        repository as unknown as AppointmentsRepository,
        mapper as unknown as AppointmentMapper,
        {} as never,
        {} as never,
        {} as never,
        {} as never,
      );
    });

    it('does not look up names when there is no search text', async () => {
      repository.countMine.mockResolvedValue(3);

      await service.findMine(STUDENT_ID, {
        scope: 'upcoming',
        page: 1,
        pageSize: 10,
      });

      expect(repository.findCounterpartIdsByName).not.toHaveBeenCalled();
      expect(repository.countMine).toHaveBeenCalledExactlyOnceWith(
        STUDENT_ID,
        'upcoming',
        expect.any(Date),
        undefined,
      );
    });

    it('searches without case, accents or repeated inner spaces', async () => {
      repository.findCounterpartIdsByName.mockResolvedValue([MENTOR_ID]);
      repository.countMine.mockResolvedValue(1);

      await service.findMine(STUDENT_ID, {
        scope: 'upcoming',
        page: 1,
        pageSize: 10,
        q: 'JOSÉ   Muñoz',
      });

      expect(
        repository.findCounterpartIdsByName,
      ).toHaveBeenCalledExactlyOnceWith(STUDENT_ID, 'jose munoz');
    });

    it('filters the count and the page by the matching counterparts', async () => {
      repository.findCounterpartIdsByName.mockResolvedValue([MENTOR_ID]);
      repository.countMine.mockResolvedValue(12);

      const result = await service.findMine(STUDENT_ID, {
        scope: 'past',
        page: 2,
        pageSize: 10,
        q: 'ana',
      });

      expect(result).toEqual({ items: [], total: 12, page: 2, pageSize: 10 });
      expect(repository.countMine).toHaveBeenCalledExactlyOnceWith(
        STUDENT_ID,
        'past',
        expect.any(Date),
        [MENTOR_ID],
      );
      expect(repository.findMine).toHaveBeenCalledExactlyOnceWith(
        STUDENT_ID,
        'past',
        expect.any(Date),
        2,
        10,
        [MENTOR_ID],
      );
    });

    it('returns an empty first page when nobody matches, even from a later page', async () => {
      repository.findCounterpartIdsByName.mockResolvedValue([]);
      repository.countMine.mockResolvedValue(0);

      const result = await service.findMine(STUDENT_ID, {
        scope: 'upcoming',
        page: 4,
        pageSize: 10,
        q: 'nadie',
      });

      expect(result).toEqual({ items: [], total: 0, page: 1, pageSize: 10 });
    });

    it('does not turn a failed name lookup into an empty result', async () => {
      const failure = new Error('Database unavailable');
      repository.findCounterpartIdsByName.mockRejectedValue(failure);

      await expect(
        service.findMine(STUDENT_ID, {
          scope: 'upcoming',
          page: 1,
          pageSize: 10,
          q: 'ana',
        }),
      ).rejects.toBe(failure);
      expect(repository.countMine).not.toHaveBeenCalled();
    });
  });
});
