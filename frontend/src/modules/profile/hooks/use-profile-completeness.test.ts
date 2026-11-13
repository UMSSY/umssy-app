import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuth } from '@/shared/contexts/auth-context';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { profileCompletenessService } from '../services/profile-completeness.service';
import type { ProfileCompletenessResponse } from '../types/profile-completeness-response.types';
import { useProfileCompleteness } from './use-profile-completeness';

vi.mock('@/shared/contexts/auth-context', () => ({ useAuth: vi.fn() }));
vi.mock('../services/profile-completeness.service', () => ({
  profileCompletenessService: { getCompleteness: vi.fn() },
}));

const response: ProfileCompletenessResponse = { percentage: 35, sections: [] };

function session(currentUserId: string | null, isLoading = false) {
  vi.mocked(useAuth).mockReturnValue({
    currentUserId,
    isLoading,
    roles: [],
    refreshRoles: vi.fn(),
  });
}

beforeEach(() => {
  session('user-a');
  vi.mocked(profileCompletenessService.getCompleteness).mockResolvedValue(
    response,
  );
});

afterEach(() => {
  cleanup();
  vi.resetAllMocks();
});

describe('useProfileCompleteness', () => {
  it('loads the saved percentage without a fabricated initial value', async () => {
    const { result } = renderHookWithQuery(() => useProfileCompleteness());
    expect(result.current.isLoading).toBe(true);
    expect(result.current.completeness).toBeNull();
    await waitFor(() => expect(result.current.completeness).toEqual(response));
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it.each([
    [null, false],
    ['user-a', true],
  ] as const)(
    'waits for an authenticated session (%s, %s)',
    async (id, loading) => {
      session(id, loading);
      const { result, rerender } = renderHookWithQuery(() =>
        useProfileCompleteness(),
      );
      await act(() => result.current.reload());
      expect(profileCompletenessService.getCompleteness).not.toHaveBeenCalled();
      expect(result.current.completeness).toBeNull();
      session('user-a');
      rerender();
      await waitFor(() =>
        expect(result.current.completeness).toEqual(response),
      );
    },
  );

  it('exposes request errors and allows a successful retry', async () => {
    vi.mocked(profileCompletenessService.getCompleteness)
      .mockRejectedValueOnce(new Error('Unavailable'))
      .mockResolvedValueOnce(response);
    const { result } = renderHookWithQuery(() => useProfileCompleteness());
    await waitFor(() =>
      expect(result.current.error).toBe(
        'No se pudo cargar el progreso de tu perfil. Intenta de nuevo.',
      ),
    );
    expect(result.current.completeness).toBeNull();
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.completeness).toEqual(response));
    expect(result.current.error).toBeNull();
  });

  it('does not present cached results as current after a failed refresh', async () => {
    const { result } = renderHookWithQuery(() => useProfileCompleteness());
    await waitFor(() => expect(result.current.completeness).toEqual(response));
    vi.mocked(profileCompletenessService.getCompleteness).mockRejectedValue(
      new Error('Unavailable'),
    );
    await act(() => result.current.reload());
    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.completeness).toBeNull();
  });

  it("does not reuse another account's cached percentage", async () => {
    const { result, rerender } = renderHookWithQuery(() =>
      useProfileCompleteness(),
    );
    await waitFor(() =>
      expect(result.current.completeness?.percentage).toBe(35),
    );
    let resolve!: (value: ProfileCompletenessResponse) => void;
    vi.mocked(profileCompletenessService.getCompleteness).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    session('user-b');
    rerender();
    expect(result.current.completeness).toBeNull();
    expect(result.current.isLoading).toBe(true);
    await act(async () => {
      resolve({ ...response, percentage: 100 });
    });
    await waitFor(() =>
      expect(result.current.completeness?.percentage).toBe(100),
    );
    session(null);
    rerender();
    expect(result.current.completeness).toBeNull();
  });

  it('cancels the request when leaving the page', () => {
    vi.mocked(profileCompletenessService.getCompleteness).mockReturnValue(
      new Promise(() => {}),
    );
    const { unmount } = renderHookWithQuery(() => useProfileCompleteness());
    const signal = vi.mocked(profileCompletenessService.getCompleteness).mock
      .calls[0][0];
    expect(signal?.aborted).toBe(false);
    unmount();
    expect(signal?.aborted).toBe(true);
  });
});
