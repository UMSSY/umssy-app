import { describe, expect, it } from 'vitest';
import { SocialAccountMapper } from '../mappers/social-account.mapper.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';

describe('SocialAccountMapper', () => {
  const mapper = new SocialAccountMapper();
  const account: SocialAccountEntity = {
    id: 'account-id',
    userId: 'user-id',
    provider: 'github',
    externalId: 'external-id',
    username: 'ana',
    profileUrl: 'https://github.com/ana',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('returns only the public connection contract, without internal user or external identifiers', () => {
    expect(mapper.toResponse(account)).toEqual({
      id: 'account-id',
      provider: 'github',
      username: 'ana',
      profileUrl: 'https://github.com/ana',
      connected: true,
    });
  });

  it('preserves a nullable profile URL for a connected account', () => {
    expect(
      mapper.toResponse({ ...account, profileUrl: null }).profileUrl,
    ).toBeNull();
  });

  it('returns supported providers as disconnected when the user has no accounts', () => {
    expect(mapper.toStatusList([])).toEqual([
      {
        provider: 'github',
        connected: false,
        username: null,
        profileUrl: null,
      },
      {
        provider: 'gitlab',
        connected: false,
        username: null,
        profileUrl: null,
      },
    ]);
  });

  it('keeps the supported provider order and does not expose internal account data', () => {
    const gitlab: SocialAccountEntity = {
      ...account,
      provider: 'gitlab',
      username: 'ana-gitlab',
      profileUrl: 'https://gitlab.com/ana-gitlab',
    };

    expect(mapper.toStatusList([gitlab, account])).toEqual([
      {
        provider: 'github',
        connected: true,
        username: 'ana',
        profileUrl: 'https://github.com/ana',
      },
      {
        provider: 'gitlab',
        connected: true,
        username: 'ana-gitlab',
        profileUrl: 'https://gitlab.com/ana-gitlab',
      },
    ]);
  });

  it('maps a partial account list without treating a missing profile URL as disconnection', () => {
    expect(
      mapper.toStatusList([
        { ...account, provider: 'gitlab', profileUrl: null },
      ]),
    ).toEqual([
      {
        provider: 'github',
        connected: false,
        username: null,
        profileUrl: null,
      },
      {
        provider: 'gitlab',
        connected: true,
        username: 'ana',
        profileUrl: null,
      },
    ]);
  });

  it.each(['github', 'gitlab'] as const)(
    'returns only the disconnection response for %s',
    (provider) => {
      expect(mapper.toDisconnectedResponse(provider)).toEqual({
        provider,
        connected: false,
      });
    },
  );
});
