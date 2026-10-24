import { FIXTURE_MENTORS } from '../../users/constants/seed-fixture-users.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const BLOCKED_DATE_KEYS = [
  'record-02846',
  'record-00061',
  'record-03015',
  'record-02581',
  'record-02301',
  'record-03127',
  'record-00395',
  'record-02875',
  'record-01426',
  'record-01245',
  'record-02748',
  'record-00615',
  'record-02185',
  'record-01843',
  'record-03391',
  'record-00852',
  'record-01555',
  'record-01062',
  'record-02193',
  'record-03088',
  'record-02427',
  'record-00834',
];
export async function seedBlockedDatesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.BlockedDateCreateManyInput[] = FIXTURE_MENTORS.map(
    (mentor, index) => ({
      id: context.getId(BLOCKED_DATE_KEYS[index]),
      mentorId: context.getId(mentor.key),
      blockedOn: context.getDate('monday', 50400, true),
      reason: 'Descanso ficticio de demostración',
      createdAt: context.anchor,
      updatedAt: context.anchor,
    }),
  );
  await tx.blockedDate.createMany({ data, skipDuplicates: true });
  return data.length;
}
