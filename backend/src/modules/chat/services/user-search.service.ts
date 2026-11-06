import { Injectable } from '@nestjs/common';
import { UserLookupRepository } from '../repositories/user-lookup.repository.js';
import { ChatRolePolicyService } from './chat-role-policy.service.js';
import { MIN_SEARCH_CHARS, MAX_SEARCH_RESULTS } from '../constants/chat.constants.js';
import type { ChatUserResponse } from '../responses/chat-user.response.js';

@Injectable()
export class UserSearchService {
  constructor(
    private readonly userLookupRepository: UserLookupRepository,
    private readonly chatRolePolicyService: ChatRolePolicyService,
  ) {}

  async search(
    rawQuery: string,
    currentUserId: string,
  ): Promise<ChatUserResponse[]> {
    const normalized = this.normalize(rawQuery);

    if (normalized.length < MIN_SEARCH_CHARS) {
      return [];
    }

    const rows = await this.userLookupRepository.searchActiveByName(
      normalized,
      currentUserId,
      MAX_SEARCH_RESULTS * 2,
    );

    const results: ChatUserResponse[] = [];

    for (const row of rows) {
      try {
        await this.chatRolePolicyService.assertCanCommunicate(currentUserId, row.id);

        results.push({
          id: row.id,
          fullName: `${row.first_name} ${row.last_name}`.trim(),
          avatarUrl: row.photo_url
            ? `data:image/jpeg;base64,${Buffer.from(row.photo_url).toString('base64')}`
            : null,
          headline: row.headline,
          role: row.role_name ?? 'GRADUATE',
          isOnline: row.is_online ?? false,
        });
      } catch {
        continue;
      }

      if (results.length >= MAX_SEARCH_RESULTS) break;
    }

    return results;
  }

  private normalize(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}