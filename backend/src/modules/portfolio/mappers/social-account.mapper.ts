import { Injectable } from '@nestjs/common';
import type { SocialAccountResponse } from '../responses/social-account.response.js';
import type { SocialAccountEntity } from '../types/social-account-entity.type.js';

@Injectable()
export class SocialAccountMapper {
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
