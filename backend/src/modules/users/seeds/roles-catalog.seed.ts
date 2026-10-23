import type { Prisma } from '../../../prisma/client.js';
import { ROLE_NAMES } from '../../../common/enums/roles.enum.js';

export async function seedRolesCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.role.createMany({
    data: ROLE_NAMES.map((name) => ({ name })),
    skipDuplicates: true,
  });
}
