import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { SocialAccountAlreadyLinkedException } from '../exceptions/social-account-already-linked.exception.js';
import { UnknownPortfolioProviderException } from '../exceptions/unknown-portfolio-provider.exception.js';
import { SocialAccountRepository } from '../repositories/social-account.repository.js';

const userId = '11111111-1111-4111-8111-111111111111';
const otherUserId = '99999999-9999-4999-8999-999999999999';
const providerId = '22222222-2222-4222-8222-222222222222';

describe('SocialAccountRepository', () => {
  let repository: SocialAccountRepository;
  let prismaMock: {
    userSocialAccount: {
      findMany: ReturnType<typeof vi.fn>;
      findFirst: ReturnType<typeof vi.fn>;
      upsert: ReturnType<typeof vi.fn>;
    };
    portfolioProvider: {
      findUnique: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    prismaMock = {
      userSocialAccount: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
        upsert: vi.fn(),
      },
      portfolioProvider: {
        findUnique: vi.fn(),
      },
    };

    repository = new SocialAccountRepository(
      prismaMock as unknown as PrismaService,
    );
  });

  describe('findByUserId', () => {
    it('returns social accounts of the user mapped to domain entities', async () => {
      const now = new Date();
      prismaMock.userSocialAccount.findMany.mockResolvedValue([
        {
          id: 'acc-1',
          userId,
          externalId: '12345',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
          createdAt: now,
          updatedAt: now,
          provider: { name: 'github' },
        },
      ]);

      const result = await repository.findByUserId(userId);

      expect(result).toEqual([
        {
          id: 'acc-1',
          userId,
          provider: 'github',
          externalId: '12345',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
          createdAt: now,
          updatedAt: now,
        },
      ]);
      expect(prismaMock.userSocialAccount.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: expect.any(Object),
        orderBy: { createdAt: 'asc' },
      });
    });
  });

  describe('upsertAccount', () => {
    it('throws UnknownPortfolioProviderException if provider does not exist', async () => {
      prismaMock.portfolioProvider.findUnique.mockResolvedValue(null);

      await expect(
        repository.upsertAccount({
          userId,
          provider: 'github',
          externalId: '12345',
          username: 'octocat',
        }),
      ).rejects.toThrow(UnknownPortfolioProviderException);
    });

    it('throws SocialAccountAlreadyLinkedException if externalId belongs to another user', async () => {
      prismaMock.portfolioProvider.findUnique.mockResolvedValue({
        id: providerId,
      });
      prismaMock.userSocialAccount.findFirst.mockResolvedValue({
        id: 'acc-existing',
        userId: otherUserId,
      });

      await expect(
        repository.upsertAccount({
          userId,
          provider: 'github',
          externalId: '12345',
          username: 'octocat',
        }),
      ).rejects.toThrow(SocialAccountAlreadyLinkedException);
    });

    it('upserts and returns account entity when valid and not claimed by other user', async () => {
      const now = new Date();
      prismaMock.portfolioProvider.findUnique.mockResolvedValue({
        id: providerId,
      });
      prismaMock.userSocialAccount.findFirst.mockResolvedValue(null);
      prismaMock.userSocialAccount.upsert.mockResolvedValue({
        id: 'acc-new',
        userId,
        externalId: '12345',
        username: 'octocat',
        profileUrl: 'https://github.com/octocat',
        createdAt: now,
        updatedAt: now,
        provider: { name: 'github' },
      });

      const result = await repository.upsertAccount({
        userId,
        provider: 'github',
        externalId: '12345',
        username: '  octocat  ',
        profileUrl: '  https://github.com/octocat  ',
      });

      expect(result).toEqual({
        id: 'acc-new',
        userId,
        provider: 'github',
        externalId: '12345',
        username: 'octocat',
        profileUrl: 'https://github.com/octocat',
        createdAt: now,
        updatedAt: now,
      });

      expect(prismaMock.userSocialAccount.upsert).toHaveBeenCalledWith({
        where: {
          userId_providerId: {
            userId,
            providerId,
          },
        },
        create: {
          userId,
          providerId,
          externalId: '12345',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
        },
        update: {
          externalId: '12345',
          username: 'octocat',
          profileUrl: 'https://github.com/octocat',
        },
        select: expect.any(Object),
      });
    });

    it('handles undefined or null profileUrl and username defaults', async () => {
      const now = new Date();
      prismaMock.portfolioProvider.findUnique.mockResolvedValue({
        id: providerId,
      });
      prismaMock.userSocialAccount.findFirst.mockResolvedValue(null);
      prismaMock.userSocialAccount.upsert.mockResolvedValue({
        id: 'acc-empty',
        userId,
        externalId: '54321',
        username: '',
        profileUrl: null,
        createdAt: now,
        updatedAt: now,
        provider: { name: 'gitlab' },
      });

      const result = await repository.upsertAccount({
        userId,
        provider: 'gitlab',
        externalId: '54321',
        username: undefined as unknown as string,
        profileUrl: undefined,
      });

      expect(result.username).toBe('');
      expect(result.profileUrl).toBeNull();
    });

    it('allows updating account if existing account belongs to the same user', async () => {
      const now = new Date();
      prismaMock.portfolioProvider.findUnique.mockResolvedValue({
        id: providerId,
      });
      prismaMock.userSocialAccount.findFirst.mockResolvedValue({
        id: 'acc-self',
        userId,
      });
      prismaMock.userSocialAccount.upsert.mockResolvedValue({
        id: 'acc-self',
        userId,
        externalId: '12345',
        username: 'octocat-updated',
        profileUrl: null,
        createdAt: now,
        updatedAt: now,
        provider: { name: 'github' },
      });

      const result = await repository.upsertAccount({
        userId,
        provider: 'github',
        externalId: '12345',
        username: 'octocat-updated',
        profileUrl: null,
      });

      expect(result.username).toBe('octocat-updated');
      expect(result.profileUrl).toBeNull();
    });
  });
});
