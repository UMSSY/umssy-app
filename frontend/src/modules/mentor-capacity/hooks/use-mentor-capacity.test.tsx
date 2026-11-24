import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { mentorCapacityQueryKeys } from '../constants/mentor-capacity-query-keys.constants';
import { mentorCapacityService } from '../services/mentor-capacity.service';
import { useUpdateMentorCapacity } from './use-mentor-capacity';

describe('mentor capacity hooks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('uses stable keys for independently paginated lists', () => {
    expect(mentorCapacityQueryKeys.requests(2)).toEqual([
      'mentor-capacity',
      'requests',
      2,
    ]);
    expect(mentorCapacityQueryKeys.offers(3)).toEqual([
      'mentor-capacity',
      'offers',
      3,
    ]);
  });

  it('updates overview and invalidates both lists after saving', async () => {
    const overview = {
      approvedGraduates: 100,
      percentage: 30,
      capacity: 30,
      activeMentors: 10,
      reservedOffers: 2,
      occupied: 12,
      available: 18,
      pendingRequests: 4,
    };
    vi.spyOn(mentorCapacityService, 'updatePercentage').mockResolvedValue(
      overview,
    );
    const queryClient = new QueryClient({
      defaultOptions: { mutations: { retry: false } },
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
    const { result } = renderHook(() => useUpdateMentorCapacity(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync(30);
    });

    expect(queryClient.getQueryData(mentorCapacityQueryKeys.overview)).toEqual(
      overview,
    );
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorCapacityQueryKeys.requests(),
    });
    expect(invalidate).toHaveBeenCalledWith({
      queryKey: mentorCapacityQueryKeys.offers(),
    });
  });
});
