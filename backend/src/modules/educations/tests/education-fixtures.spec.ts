import { describe, expect, it, vi } from 'vitest';
import type { SeedEducationPayload } from '../types/seed-education-payload.types.js';
import { FixtureContext } from '../../../common/database/fixture-context.js';
import { FIXTURE_USERS } from '../../users/constants/seed-fixture-users.constants.js';
import { seedAccessRequestsFixtures } from '../../access-requests/seeds/access-requests-fixtures.seed.js';
import { seedEducationsFixtures } from '../seeds/educations-fixtures.seed.js';

function createFixtureContext() {
  const context = new FixtureContext(new Date('2026-11-04T12:00:00Z'), 'admin');
  vi.spyOn(context, 'getReference').mockImplementation((_table, value) => value);
  return context;
}

describe('education fixture career alignment', () => {
  it('matches approved request careers for all affected demo users', async () => {
    const context = createFixtureContext();
    const requests = vi.fn().mockResolvedValue({ count: 0 });
    const educations = vi.fn().mockResolvedValue({ count: 0 });
    const tx = {
      accessRequest: { createMany: requests, updateMany: vi.fn() },
      education: { createMany: educations, updateMany: vi.fn() },
    };
    await seedAccessRequestsFixtures(tx as never, context);
    await seedEducationsFixtures(tx as never, context);
    for (const user of FIXTURE_USERS.slice(20, 42)) {
      const request = requests.mock.calls[0]![0].data.find(
        (row: { email: string }) => row.email === `seed.user${user.number}@umssy.test`,
      );
      const education = educations.mock.calls[0]![0].data.find(
        (row: { userId: string }) => row.userId === context.getId(user.key),
      );
      expect(request.statusId).toBe('approved');
      expect(education.degree).toBe(request.careerId.includes('Informática')
        ? 'Ingeniería Informática' : 'Ingeniería de Sistemas');
    }
  });

  it('repairs existing swapped rows on rerun while preserving other records', async () => {
    const context = createFixtureContext();
    const rows = new Map<string, SeedEducationPayload>();
    const tx = { education: {
      createMany: vi.fn(async ({ data }: { data: SeedEducationPayload[] }) => {
        for (const row of data) if (!rows.has(row.id)) rows.set(row.id, { ...row });
      }),
      updateMany: vi.fn(async ({ where, data }: { where: SeedEducationPayload; data: { degree: string } }) => {
        const row = rows.get(where.id);
        if (row?.userId === where.userId && row.degree === where.degree) row.degree = data.degree;
      }),
    } };
    await seedEducationsFixtures(tx as never, context);
    const expected = structuredClone([...rows.values()]);
    const affected = new Set(FIXTURE_USERS.slice(20, 42).map(user => context.getId(user.key)));
    for (const row of rows.values()) if (affected.has(row.userId)) {
      row.degree = row.degree === 'Ingeniería Informática' ? 'Ingeniería de Sistemas' : 'Ingeniería Informática';
    }
    rows.set('unrelated', { id: 'unrelated', userId: 'real-user', degree: 'Other degree' });
    await seedEducationsFixtures(tx as never, context);
    await seedEducationsFixtures(tx as never, context);
    for (const row of expected) expect(rows.get(row.id)).toEqual(row);
    expect(rows.size).toBe(expected.length + 1);
    expect(rows.get('unrelated')?.degree).toBe('Other degree');
  });
});
