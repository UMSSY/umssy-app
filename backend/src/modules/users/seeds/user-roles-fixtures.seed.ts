import { FIXTURE_USERS } from '../constants/seed-fixture-users.constants.js';
import type { Prisma } from '../../../prisma/client.js';
import type { FixtureContext } from '../../../common/database/fixture-context.js';

const ROLE_KEYS = [
  ['record-02853'],
  ['record-01134'],
  ['record-00051'],
  ['record-01795'],
  ['record-03165'],
  ['record-02547'],
  ['record-01597'],
  ['record-01839'],
  ['record-00411'],
  ['record-02835'],
  ['record-02349'],
  ['record-01265'],
  ['record-00858', 'record-02591'],
  ['record-02501', 'record-02180'],
  ['record-01510', 'record-00576'],
  ['record-02223', 'record-00212'],
  ['record-02505', 'record-03258'],
  ['record-00135', 'record-02549'],
  ['record-03453', 'record-00573'],
  ['record-02600', 'record-02740'],
  ['record-01907'],
  ['record-01300'],
  ['record-01190'],
  ['record-00484'],
  ['record-00981'],
  ['record-01707'],
  ['record-01323'],
  ['record-00321'],
  ['record-02214'],
  ['record-03113'],
  ['record-00255'],
  ['record-01718'],
  ['record-01977', 'record-02065'],
  ['record-02432', 'record-00650'],
  ['record-02174', 'record-01712'],
  ['record-01870', 'record-02714'],
  ['record-00846', 'record-00563'],
  ['record-02833', 'record-02860'],
  ['record-01774', 'record-01642'],
  ['record-00788', 'record-01824'],
  ['record-01972', 'record-00233'],
  ['record-01978', 'record-02871'],
  ['record-01905'],
  ['record-02437'],
  ['record-01463'],
  ['record-00096'],
  ['record-00850'],
  ['record-01796'],
  ['record-03434'],
  ['record-02513'],
];
export async function seedUserRolesFixtures(
  tx: Prisma.TransactionClient,
  context: FixtureContext,
): Promise<number> {
  const data: Prisma.UserRoleCreateManyInput[] = FIXTURE_USERS.flatMap(
    (user, userIndex) =>
      user.roles.map((role, roleIndex) => ({
        id: context.getId(ROLE_KEYS[userIndex][roleIndex]),
        userId: context.getId(user.key),
        roleId: context.getReference('roles', role),
        startAt: context.getDate('anchor', -2880 + roleIndex, false),
        deletedAt: null,
        createdAt: context.anchor,
        updatedAt: context.anchor,
      })),
  );
  await tx.userRole.createMany({ data, skipDuplicates: true });
  return data.length;
}
