import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { profileCompletenessService } from './profile-completeness.service';

vi.mock('@/shared/services/api-client', () => ({
  apiClient: { get: vi.fn() },
}));
vi.mock('../utils/get-auth-headers', () => ({
  getAuthHeaders: () => ({ Authorization: 'Bearer test-token' }),
}));

const response = {
  percentage: 35,
  sections: [
    { id: 'contact', weight: 20, isCompleted: true },
    { id: 'presentation', weight: 15, isCompleted: true },
    { id: 'education', weight: 20, isCompleted: false },
    { id: 'work-experience', weight: 20, isCompleted: false },
    { id: 'skills', weight: 15, isCompleted: false },
    { id: 'certifications', weight: 10, isCompleted: false },
  ],
};

function respond(data: unknown, ok = true) {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { statusCode: 200, ok, detail: 'OK', data },
  });
}

afterEach(() => vi.resetAllMocks());

describe('profileCompletenessService', () => {
  it('requests authenticated completeness and preserves the server response', async () => {
    respond(response);
    const signal = new AbortController().signal;
    await expect(
      profileCompletenessService.getCompleteness(signal),
    ).resolves.toEqual(response);
    expect(apiClient.get).toHaveBeenCalledExactlyOnceWith(
      '/profile/completeness',
      {
        headers: { Authorization: 'Bearer test-token' },
        signal,
      },
    );
  });

  it.each([0, 35, 100])(
    'accepts the exact percentage %s without recalculating weights',
    async (percentage) => {
      respond({ ...response, percentage });
      expect(
        (await profileCompletenessService.getCompleteness()).percentage,
      ).toBe(percentage);
    },
  );

  it.each([null, undefined, '35', NaN, Infinity, -1, 101, 35.5])(
    'rejects an invalid percentage: %s',
    async (percentage) => {
      respond({ ...response, percentage });
      await expect(
        profileCompletenessService.getCompleteness(),
      ).rejects.toThrow('Invalid profile completeness response');
    },
  );

  it.each([
    null,
    undefined,
    {},
    { ...response, sections: null },
    { ...response, sections: [] },
  ])('rejects missing response data: %j', async (data) => {
    respond(data);
    await expect(profileCompletenessService.getCompleteness()).rejects.toThrow(
      'Invalid profile completeness response',
    );
  });

  it.each([
    null,
    { id: 'unknown', weight: 20, isCompleted: true },
    { id: 'contact', weight: '20', isCompleted: true },
    { id: 'contact', weight: -1, isCompleted: true },
    { id: 'contact', weight: 101, isCompleted: true },
    { id: 'contact', weight: 20, isCompleted: 'true' },
    { id: 'presentation', weight: 20, isCompleted: true },
  ])('rejects malformed or duplicate sections: %j', async (section) => {
    respond({
      ...response,
      sections: [section, ...response.sections.slice(1)],
    });
    await expect(profileCompletenessService.getCompleteness()).rejects.toThrow(
      'Invalid profile completeness response',
    );
  });

  it('rejects an unsuccessful envelope even if it contains valid data', async () => {
    respond(response, false);
    await expect(profileCompletenessService.getCompleteness()).rejects.toThrow(
      'Invalid profile completeness response',
    );
  });

  it('propagates API failures without substituting sample data', async () => {
    const error = new Error('Network unavailable');
    vi.mocked(apiClient.get).mockRejectedValue(error);
    await expect(profileCompletenessService.getCompleteness()).rejects.toBe(
      error,
    );
  });
});
