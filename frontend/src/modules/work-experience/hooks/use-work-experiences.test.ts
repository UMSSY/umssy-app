import { renderHookWithQuery as renderHook } from '@/shared/testing/render-hook-with-query';
import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WORK_EXPERIENCE_FEEDBACK_MESSAGES } from '../config/work-experience-feedback.config';
import { workExperienceService } from '../services/work-experience.service';
import type { WorkExperienceItem } from '../types/work-experience-item.types';
import { useWorkExperiences } from './use-work-experiences';
import { createQueryWrapper } from '@/shared/testing/create-query-wrapper';

vi.mock('../services/work-experience.service', () => ({
  workExperienceService: { getWorkExperiences: vi.fn() },
}));

const EXPERIENCE: WorkExperienceItem = {
  id: 'experience-1',
  companyName: 'Synapse Labs',
  position: 'Desarrolladora web junior',
  startDate: '2025-03-01',
  endDate: null,
  isCurrent: true,
  description: null,
};

function createDeferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('useWorkExperiences', () => {
  afterEach(() => {
    cleanup();
    vi.resetAllMocks();
  });

  it('reuses guide records on return and still refreshes them after an explicit invalidation', async () => {
    const { wrapper, client } = createQueryWrapper();
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValueOnce([
      EXPERIENCE,
    ]);
    const first = renderHook(() => useWorkExperiences({ forGuide: true }), {
      wrapper,
    });
    await waitFor(() =>
      expect(first.result.current.experiences).toEqual([EXPERIENCE]),
    );
    first.unmount();
    const second = renderHook(() => useWorkExperiences({ forGuide: true }), {
      wrapper,
    });
    expect(second.result.current.isLoading).toBe(false);
    expect(workExperienceService.getWorkExperiences).toHaveBeenCalledOnce();
    const refreshing = createDeferred<WorkExperienceItem[]>();
    vi.mocked(workExperienceService.getWorkExperiences).mockReturnValueOnce(
      refreshing.promise,
    );
    let refreshed!: Promise<void>;
    act(() => {
      refreshed = client.invalidateQueries({
        queryKey: ['work-experience', 'experiences'],
      });
    });
    await waitFor(() =>
      expect(workExperienceService.getWorkExperiences).toHaveBeenCalledTimes(2),
    );
    expect(second.result.current.isLoading).toBe(false);
    await act(async () => {
      refreshing.resolve([]);
      await refreshed;
    });
    await waitFor(() => expect(second.result.current.experiences).toEqual([]));
  });

  it('loads the experiences of the user', async () => {
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([
      EXPERIENCE,
    ]);
    const { result } = renderHook(() => useWorkExperiences());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await waitFor(() =>
      expect(result.current.experiences).toEqual([EXPERIENCE]),
    );
    await waitFor(() => expect(result.current.error).toBeNull());
  });

  it('shows an error when the experiences cannot be loaded', async () => {
    vi.mocked(workExperienceService.getWorkExperiences).mockRejectedValue(
      new Error('fail'),
    );
    const { result } = renderHook(() => useWorkExperiences());

    await waitFor(() =>
      expect(result.current.error).toBe(
        WORK_EXPERIENCE_FEEDBACK_MESSAGES.loadError,
      ),
    );
  });

  it('ignores an older response that arrives after a newer reload', async () => {
    const initialLoad = createDeferred<WorkExperienceItem[]>();
    const latest = [
      EXPERIENCE,
      { ...EXPERIENCE, id: 'experience-2', position: 'Analista' },
    ];
    vi.mocked(workExperienceService.getWorkExperiences)
      .mockReturnValueOnce(initialLoad.promise)
      .mockResolvedValueOnce(latest);
    const { result } = renderHook(() => useWorkExperiences());

    await act(async () => {
      await result.current.reload();
    });
    await waitFor(() => expect(result.current.experiences).toEqual(latest));

    await act(async () => {
      initialLoad.resolve([]);
      await initialLoad.promise;
    });

    await waitFor(() => expect(result.current.experiences).toEqual(latest));
  });

  it('does not update the state when a reload finishes after unmounting', async () => {
    const reloadRequest = createDeferred<WorkExperienceItem[]>();
    vi.mocked(workExperienceService.getWorkExperiences)
      .mockResolvedValueOnce([EXPERIENCE])
      .mockReturnValueOnce(reloadRequest.promise);
    const { result, unmount } = renderHook(() => useWorkExperiences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let pendingReload: Promise<void> = Promise.resolve();
    act(() => {
      pendingReload = result.current.reload();
    });
    unmount();
    reloadRequest.resolve([]);
    await pendingReload;

    await waitFor(() =>
      expect(result.current.experiences).toEqual([EXPERIENCE]),
    );
  });

  it('does not request the list again after unmounting', async () => {
    vi.mocked(workExperienceService.getWorkExperiences).mockResolvedValue([
      EXPERIENCE,
    ]);
    const { result, unmount } = renderHook(() => useWorkExperiences());
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    unmount();

    await result.current.reload();

    expect(workExperienceService.getWorkExperiences).toHaveBeenCalledTimes(1);
  });
});
