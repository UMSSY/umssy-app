'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { mentorCapacityQueryKeys } from '../constants/mentor-capacity-query-keys.constants';
import { mentorCapacityService } from '../services/mentor-capacity.service';

export function useMentorCapacityOverview() {
  return useQuery({
    queryKey: mentorCapacityQueryKeys.overview,
    queryFn: ({ signal }) => mentorCapacityService.getOverview(signal),
  });
}

export function useWaitingMentorRequests(page: number) {
  return useQuery({
    queryKey: mentorCapacityQueryKeys.requests(page),
    queryFn: ({ signal }) =>
      mentorCapacityService.getWaitingRequests(page, signal),
  });
}

export function useMentorOfferHistory(page: number) {
  return useQuery({
    queryKey: mentorCapacityQueryKeys.offers(page),
    queryFn: ({ signal }) =>
      mentorCapacityService.getOfferHistory(page, signal),
  });
}

export function useUpdateMentorCapacity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: mentorCapacityService.updatePercentage,
    onSuccess: async (data) => {
      queryClient.setQueryData(mentorCapacityQueryKeys.overview, data);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: mentorCapacityQueryKeys.requests(),
        }),
        queryClient.invalidateQueries({
          queryKey: mentorCapacityQueryKeys.offers(),
        }),
      ]);
      toast.success('Límite de participación actualizado.', {
        duration: 4000,
      });
    },
    onError: () => {
      toast.error(
        'No se pudo guardar el límite. Revisa tu conexión e inténtalo nuevamente.',
      );
    },
  });
}

export function useRefreshMentorCapacity() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: mentorCapacityQueryKeys.all,
    });
}
