import { describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../../../common/prisma/prisma.service.js';
import { MentorsRepository } from '../repositories/mentors.repository.js';
import { MentorProfileSuggestionsService } from '../services/mentor-profile-suggestions.service.js';
import {
  buildEmptyMentorProfile,
  buildMentorProfile,
} from './fixtures/mentor-profile.fixture.js';

function freezeNested(value: unknown): void {
  if (value === null || typeof value !== 'object') return;
  // Typed arrays cannot be frozen with elements; their bytes are compared below.
  if (ArrayBuffer.isView(value)) return;
  for (const child of Object.values(value)) freezeNested(child);
  Object.freeze(value);
}

describe('read-only suggestion evaluation', () => {
  it.each(['complete', 'partial', 'empty'] as const)(
    'only calls the existing Prisma reader for a $state profile',
    async (state) => {
      const profile =
        state === 'empty'
          ? buildEmptyMentorProfile()
          : buildMentorProfile({
              aboutMe: state === 'partial' ? null : '  Mentora  ',
            });
      const before = structuredClone(profile);
      freezeNested(profile);
      const findFirst = vi.fn().mockResolvedValue(profile);
      const operations: string[] = [];
      // Fail on any unexpected database operation, including writes, raw SQL or transactions.
      const user = new Proxy(
        { findFirst },
        {
          get(target, key) {
            operations.push(`user.${String(key)}`);
            if (key !== 'findFirst')
              throw new Error(`Unexpected user operation: ${String(key)}`);
            return target.findFirst;
          },
        },
      );
      const prisma = new Proxy(
        { user },
        {
          get(target, key) {
            operations.push(String(key));
            if (key !== 'user')
              throw new Error(`Unexpected Prisma operation: ${String(key)}`);
            return target.user;
          },
        },
      );
      const repository = new MentorsRepository(
        prisma as unknown as PrismaService,
      );
      const service = new MentorProfileSuggestionsService(repository);
      const result = await service.findSuggestions(profile.id);
      expect(result).toHaveLength(
        state === 'complete' ? 0 : state === 'partial' ? 1 : 4,
      );
      expect(findFirst).toHaveBeenCalledTimes(1);
      expect(operations).toEqual(['user', 'user.findFirst']);
      expect(profile).toEqual(before);
    },
  );
});
