import type { Prisma } from '../../../prisma/client.js';

export async function seedPortfolioProvidersCatalog(
  tx: Prisma.TransactionClient,
): Promise<void> {
  await tx.portfolioProvider.createMany({
    data: [
      { name: 'github', description: 'GitHub' },
      { name: 'gitlab', description: 'GitLab' },
    ],
    skipDuplicates: true,
  });
}
