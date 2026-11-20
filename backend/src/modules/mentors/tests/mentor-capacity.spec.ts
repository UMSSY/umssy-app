import type { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorsService } from '../services/mentors.service.js';
import { MentorMapper } from '../mappers/mentor.mapper.js';
import type { UserSkillService } from '../../skills/services/user-skill.service.js';
import { mentorCapacity } from '../utils/mentor-capacity.js';
import { MentorCapacityAdminRepository } from '../repositories/mentor-capacity-admin.repository.js';
import { reconcileMentorOffers } from '../repositories/mentor-offers.queries.js';

vi.mock('../repositories/mentor-offers.queries.js', () => ({
  reconcileMentorOffers: vi.fn(),
}));

describe('capacidad HU-7-1', () => {
  it('reconcilia ofertas dentro de la actualización administrativa de capacidad', async () => {
    const tx = {
      $executeRaw: vi.fn(),
      $queryRaw: vi
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            approvedGraduates: 10,
            activeMentors: 2,
            reservedOffers: 1,
            percentage: 40,
          },
        ])
        .mockResolvedValueOnce([{ count: 0 }]),
    };
    const prisma = {
      $transaction: vi.fn(
        async (operation: (transaction: typeof tx) => Promise<unknown>) =>
          operation(tx),
      ),
    } as unknown as PrismaService;

    const repository = new MentorCapacityAdminRepository(prisma);

    await repository.updatePercentage(40);

    expect(reconcileMentorOffers).toHaveBeenCalledExactlyOnceWith(tx);
  });

  it.each([
    [0, 0],
    [1, 1],
    [2, 1],
    [3, 2],
    [5, 2],
    [9, 4],
    [10, 4],
    [25, 10],
  ])(
    'aplica el 40 %% de %i titulados redondeando hacia arriba',
    (approvedGraduates, capacity) => {
      expect(
        mentorCapacity({
          approvedGraduates,
          activeMentors: 0,
          reservedOffers: 0,
        }).capacity,
      ).toBe(capacity);
    },
  );

  it('incluye ofertas vigentes y no publica disponibilidad negativa', () => {
    expect(
      mentorCapacity({
        approvedGraduates: 5,
        activeMentors: 1,
        reservedOffers: 1,
      }),
    ).toMatchObject({ occupied: 2, available: 0 });
    expect(
      mentorCapacity({
        approvedGraduates: 5,
        activeMentors: 3,
        reservedOffers: 0,
      }).available,
    ).toBe(0);
  });

  it('calcula capacidad con el porcentaje configurado', () => {
    expect(
      mentorCapacity({
        approvedGraduates: 340,
        activeMentors: 68,
        reservedOffers: 12,
        percentage: 25,
      }),
    ).toMatchObject({
      capacity: 85,
      occupied: 80,
      available: 5,
      percentage: 25,
    });
  });

  it('redondea hacia arriba los cupos fraccionarios según el porcentaje configurado', () => {
    expect(
      mentorCapacity({
        approvedGraduates: 341,
        activeMentors: 0,
        reservedOffers: 0,
        percentage: 35,
      }).capacity,
    ).toBe(120);
  });

  it('conserva participaciones ocupadas al reducir el límite', () => {
    expect(
      mentorCapacity({
        approvedGraduates: 100,
        activeMentors: 30,
        reservedOffers: 10,
        percentage: 20,
      }),
    ).toMatchObject({
      capacity: 20,
      occupied: 40,
      available: 0,
    });
  });

  function fixture(eligible = true, alreadyMentor = false, reservedOffers = 0) {
    let mentors = 0;
    let held = Promise.resolve();
    const writes = vi.fn().mockImplementation(async () => {
      mentors += 1;
    });
    const queries: string[] = [];
    const tx = {
      $executeRaw: vi.fn(),
      $queryRaw: async (strings: TemplateStringsArray) => {
        const sql = strings.join(' ');
        queries.push(sql);
        if (sql.includes('pg_advisory_xact_lock')) return [];
        if (sql.includes('AS eligible')) return [{ eligible, alreadyMentor }];
        if (sql.includes('AS "hasPendingRequest"'))
          return [{ hasPendingRequest: false, hasOffer: false }];
        return [
          { approvedGraduates: 2, activeMentors: mentors, reservedOffers },
        ];
      },
      userRole: { create: writes },
      mentorTechnicalArea: { deleteMany: vi.fn(), createMany: vi.fn() },
      mentorOrientationType: { deleteMany: vi.fn(), createMany: vi.fn() },
      user: { update: vi.fn() },
    };
    const prisma = {
      // Simula el bloqueo de PostgreSQL; el segundo lector ve la escritura del primero.
      $transaction: async <T>(
        operation: (transaction: typeof tx) => Promise<T>,
      ) => {
        const previous = held;
        let release = () => {};
        held = new Promise<void>((resolve) => {
          release = resolve;
        });
        await previous;
        try {
          return await operation(tx);
        } finally {
          release();
        }
      },
    } as unknown as PrismaService;
    const repository = new MentorsRepository(prisma);
    vi.spyOn(repository, 'findMentorRole').mockResolvedValue({
      id: 'mentor-role',
    });
    vi.spyOn(repository, 'findActiveUserRole').mockResolvedValue(null);
    vi.spyOn(repository, 'findTechnicalAreas').mockResolvedValue([
      { id: 'area' },
    ]);
    vi.spyOn(repository, 'findActiveOrientationTypes').mockResolvedValue([
      { id: 'orientation' },
    ]);
    const service = new MentorsService(
      repository,
      new MentorMapper(),
      {} as UserSkillService,
      {} as MentorProfileSuggestionsService,
    );
    return { service, writes, queries };
  }

  it('rechaza la cuenta no elegible sin crear registros', async () => {
    const { service, writes } = fixture(false);
    await expect(
      service.activate('user-1', {
        technicalAreaIds: ['area'],
        orientationTypeIds: ['orientation'],
      }),
    ).rejects.toMatchObject({ statusCode: 403 });
    expect(writes).not.toHaveBeenCalled();
  });

  it('rechaza el rol ya activo y la capacidad reservada sin crear registros', async () => {
    for (const context of [fixture(true, true), fixture(true, false, 1)]) {
      await expect(
        context.service.activate('user-1', {
          technicalAreaIds: ['area'],
          orientationTypeIds: ['orientation'],
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
      expect(context.writes).not.toHaveBeenCalled();
    }
  });

  it('reconsulta dentro del bloqueo y solo permite una alta para el último cupo', async () => {
    const { service, writes, queries } = fixture();
    const results = await Promise.allSettled(
      ['user-1', 'user-2'].map((userId) =>
        service.activate(userId, {
          technicalAreaIds: ['area'],
          orientationTypeIds: ['orientation'],
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === 'fulfilled'),
    ).toHaveLength(1);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(queries[0]).toContain('pg_advisory_xact_lock(1436)');
    const capacityQuery = queries.find((query) =>
      query.includes('AS "approvedGraduates"'),
    );
    expect(capacityQuery).toContain('ar.approved_user_id = u.id');
    expect(capacityQuery).toContain('expires_at > (SELECT now FROM instant)');
  });
});
