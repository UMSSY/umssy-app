import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { mentorCapacity } from '../utils/mentor-capacity.js';

vi.mock('../repositories/mentor-offers.queries.js', () => ({ reconcileMentorOffers: vi.fn() }));

describe('capacidad HU-7-1', () => {
  it.each([[0, 0], [2, 0], [3, 1], [9, 3], [25, 10]])('aplica el 40 %% de %i titulados con redondeo hacia abajo', (approvedGraduates, capacity) => {
    expect(mentorCapacity({ approvedGraduates, activeMentors: 0, reservedOffers: 0 }).capacity).toBe(capacity);
  });

  it('incluye ofertas vigentes y no publica disponibilidad negativa', () => {
    expect(mentorCapacity({ approvedGraduates: 5, activeMentors: 1, reservedOffers: 1 })).toMatchObject({ occupied: 2, available: 0 });
    expect(mentorCapacity({ approvedGraduates: 5, activeMentors: 3, reservedOffers: 0 }).available).toBe(0);
  });

  function fixture(eligible = true, alreadyMentor = false, reservedOffers = 0) {
    let mentors = 0;
    let held = Promise.resolve();
    const writes = vi.fn().mockImplementation(async () => { mentors += 1; });
    const queries: string[] = [];
    const tx = {
      $executeRaw: vi.fn(),
      $queryRaw: async (strings: TemplateStringsArray) => {
        const sql = strings.join(' ');
        queries.push(sql);
        if (sql.includes('pg_advisory_xact_lock')) return [];
        if (sql.includes('AS eligible')) return [{ eligible, alreadyMentor }];
        return [{ approvedGraduates: 3, activeMentors: mentors, reservedOffers }];
      },
      userRole: { create: writes },
      mentorTechnicalArea: { deleteMany: vi.fn(), createMany: vi.fn() },
      mentorOrientationType: { deleteMany: vi.fn(), createMany: vi.fn() },
      user: { update: vi.fn() },
    };
    const prisma = {
      // Simula el bloqueo de PostgreSQL; el segundo lector ve la escritura del primero.
      $transaction: async <T>(operation: (transaction: typeof tx) => Promise<T>) => {
        const previous = held;
        let release = () => {};
        held = new Promise<void>((resolve) => { release = resolve; });
        await previous;
        try { return await operation(tx); } finally { release(); }
      },
    } as unknown as PrismaService;
    return { repository: new MentorsRepository(prisma), writes, queries };
  }

  it('rechaza la cuenta no elegible sin crear registros', async () => {
    const { repository, writes } = fixture(false);
    await expect(repository.activate('user-1', 'mentor-role', ['area'], ['orientation'])).rejects.toMatchObject({ statusCode: 403 });
    expect(writes).not.toHaveBeenCalled();
  });

  it('rechaza el rol ya activo y la capacidad reservada sin crear registros', async () => {
    for (const context of [fixture(true, true), fixture(true, false, 1)]) {
      await expect(context.repository.activate('user-1', 'mentor-role', ['area'], ['orientation'])).rejects.toMatchObject({ statusCode: 409 });
      expect(context.writes).not.toHaveBeenCalled();
    }
  });

  it('reconsulta dentro del bloqueo y solo permite una alta para el último cupo', async () => {
    const { repository, writes, queries } = fixture();
    const results = await Promise.allSettled(['user-1', 'user-2'].map((userId) =>
      repository.activate(userId, 'mentor-role', ['area'], ['orientation'])));
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(writes).toHaveBeenCalledTimes(1);
    expect(queries[0]).toContain('pg_advisory_xact_lock(1436)');
    expect(queries[2]).toContain('ar.approved_user_id = u.id');
    expect(queries[2]).toContain("expires_at > (SELECT now FROM instant)");
  });
});
