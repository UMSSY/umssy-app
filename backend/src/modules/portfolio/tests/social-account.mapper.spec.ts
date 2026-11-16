import { describe, expect, it } from 'vitest';
import { SocialAccountMapper } from '../mappers/social-account.mapper.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';

describe('SocialAccountMapper', () => {
  const mapper = new SocialAccountMapper();
  const account: SocialAccountEntity = {
    id: 'account-id', userId: 'user-id', provider: 'github', externalId: 'external-id',
    username: 'ana', profileUrl: 'https://github.com/ana',
    createdAt: new Date(), updatedAt: new Date(),
  };

  it('returns only the public connection contract, without internal user or external identifiers', () => {
    expect(mapper.toResponse(account)).toEqual({
      id: 'account-id', provider: 'github', username: 'ana',
      profileUrl: 'https://github.com/ana', connected: true,
    });
  });

  it('preserves a nullable profile URL for a connected account', () => {
    expect(mapper.toResponse({ ...account, profileUrl: null }).profileUrl).toBeNull();
  });
});
