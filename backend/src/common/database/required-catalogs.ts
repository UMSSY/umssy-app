import type { Prisma } from '../../prisma/client.js';
import { seedRolesCatalog } from '../../modules/users/seeds/roles-catalog.seed.js';
import { seedCitiesCatalog } from '../../modules/profile/seeds/cities-catalog.seed.js';
import { seedRadarAreasCatalog } from '../../modules/profile/seeds/radar-areas-catalog.seed.js';
import { seedSkillsCatalog } from '../../modules/skills/seeds/skills-catalog.seed.js';
import { seedCatalogStages } from './catalog-stages.js';

export async function seedRequiredCatalogs(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await seedRolesCatalog(tx);
  await seedCitiesCatalog(tx);
  await seedRadarAreasCatalog(tx);
  await seedSkillsCatalog(tx);
  await seedCatalogStages(tx);
}
