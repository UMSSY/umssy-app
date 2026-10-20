import { describe, expect, it, vi } from 'vitest';
import { UserSearchService } from './user-search.service.js';
import type { UserLookupRepository } from '../repositories/user-lookup.repository.js';

describe('UserSearchService', () => {
  const createMockService = () => {
    const userLookupRepository = {
      searchActiveByName: vi.fn(),
    } as unknown as UserLookupRepository;

    const service = new UserSearchService(userLookupRepository);

    return {
      service,
      userLookupRepository: userLookupRepository as unknown as {
        searchActiveByName: ReturnType<typeof vi.fn>;
      },
    };
  };

  it('returns empty array when query is less than MIN_SEARCH_CHARS', async () => {
    const { service, userLookupRepository } = createMockService();

    const result = await service.search('a', 'user-current');
    expect(result).toEqual([]);
    expect(userLookupRepository.searchActiveByName).not.toHaveBeenCalled();
  });

  it('normalizes query and searches active users', async () => {
    const { service, userLookupRepository } = createMockService();
    userLookupRepository.searchActiveByName.mockResolvedValue([
      {
        id: 'u-1',
        first_name: 'María',
        last_name: 'Gómez',
        headline: 'Frontend Lead',
        photo_url: null,
        is_online: true,
        role_name: 'mentor',
      },
    ]);

    const result = await service.search('  maría  ', 'user-current');

    expect(userLookupRepository.searchActiveByName).toHaveBeenCalledWith(
      'maria',
      'user-current',
      20,
    );
    expect(result).toEqual([
      {
        id: 'u-1',
        fullName: 'María Gómez',
        avatarUrl: null,
        headline: 'Frontend Lead',
        role: 'mentor',
        isOnline: true,
      },
    ]);
  });

  it('deduplicates rows having the same user id', async () => {
    const { service, userLookupRepository } = createMockService();
    userLookupRepository.searchActiveByName.mockResolvedValue([
      {
        id: 'u-1',
        first_name: 'Carlos',
        last_name: 'Pérez',
        headline: 'Dev',
        photo_url: null,
        is_online: false,
        role_name: 'titulado',
      },
      {
        id: 'u-1',
        first_name: 'Carlos',
        last_name: 'Pérez',
        headline: 'Dev',
        photo_url: null,
        is_online: false,
        role_name: 'mentor',
      },
      {
        id: 'u-2',
        first_name: 'Ana',
        last_name: 'López',
        headline: 'Designer',
        photo_url: null,
        is_online: true,
        role_name: 'estudiante',
      },
    ]);

    const result = await service.search('carlos', 'user-current');

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('u-1');
    expect(result[1].id).toBe('u-2');
  });

  it('formats photo_url as base64 data url when present', async () => {
    const { service, userLookupRepository } = createMockService();
    const fakePhotoBuffer = Buffer.from('fake-photo-binary');
    userLookupRepository.searchActiveByName.mockResolvedValue([
      {
        id: 'u-1',
        first_name: 'Juan',
        last_name: 'Pérez',
        headline: null,
        photo_url: fakePhotoBuffer,
        is_online: null,
        role_name: null,
      },
    ]);

    const result = await service.search('juan', 'user-current');

    expect(result).toEqual([
      {
        id: 'u-1',
        fullName: 'Juan Pérez',
        avatarUrl: `data:image/jpeg;base64,${fakePhotoBuffer.toString('base64')}`,
        headline: null,
        role: 'GRADUATE',
        isOnline: false,
      },
    ]);
  });
});

