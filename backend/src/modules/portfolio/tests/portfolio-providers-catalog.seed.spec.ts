import { describe, expect, it, vi } from 'vitest';
import { seedPortfolioProvidersCatalog } from '../seeds/portfolio-providers-catalog.seed.js';

describe('seedPortfolioProvidersCatalog', () => {
  it('seeds github and gitlab providers idempotently with skipDuplicates', async () => {
    const tx = {
      portfolioProvider: {
        createMany: vi.fn().mockResolvedValue({ count: 2 }),
      },
    };

    await seedPortfolioProvidersCatalog(tx as any);

    expect(tx.portfolioProvider.createMany).toHaveBeenCalledWith({
      data: [
        { name: 'github', description: 'GitHub' },
        { name: 'gitlab', description: 'GitLab' },
      ],
      skipDuplicates: true,
    });
  });
});
