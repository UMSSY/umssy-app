import { Injectable } from '@nestjs/common';
import { PORTFOLIO_PROVIDERS } from '../constants/portfolio-provider.constants.js';
import type { SocialAccountDisconnectResponse } from '../responses/social-account-disconnect.response.js';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import type { SocialAccountStatusResponse } from '../responses/social-account-status.response.js';
import type { PortfolioProvider } from '../types/portfolio-provider.type.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';

@Injectable()
export class SocialAccountMapper {
  toStatusList(
    accounts: readonly SocialAccountEntity[],
  ): SocialAccountStatusResponse[] {
    const accountMap = new Map(
      accounts.map((account) => [account.provider, account]),
    );

    return PORTFOLIO_PROVIDERS.map((provider) => {
      const account = accountMap.get(provider);
      return {
        provider,
        connected: Boolean(account),
        username: account?.username ?? null,
        profileUrl: account?.profileUrl ?? null,
      };
    });
  }

  toDisconnectedResponse(
    provider: PortfolioProvider,
  ): SocialAccountDisconnectResponse {
    return { provider, connected: false };
  }

  toResponse(account: SocialAccountEntity): SocialAccountResponse {
    return {
      id: account.id,
      provider: account.provider,
      username: account.username,
      profileUrl: account.profileUrl,
      connected: true,
    };
  }
}
