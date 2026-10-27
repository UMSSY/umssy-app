"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MENTORSHIP_QUERY_KEYS } from "@/modules/mentorship";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { AVAILABILITY_STATUS_TOAST } from "../constants/availability-status.constants";
import { availabilityApi } from "../services/availability.api";
import type { MentorAvailabilityStatus } from "../types/mentor-availability-status.types";

export function useAvailabilityStatus() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: AVAILABILITY_QUERY_KEYS.status,
    queryFn: () => availabilityApi.getMyAvailabilityStatus(),
  });
  const mutation = useMutation({
    mutationFn: ({ mentorId, isAvailable }: MentorAvailabilityStatus) =>
      availabilityApi.updateAvailabilityStatus(mentorId, isAvailable),
    onSuccess: (status) => {
      queryClient.setQueryData(AVAILABILITY_QUERY_KEYS.status, status);
      toast.success(status.isAvailable ? AVAILABILITY_STATUS_TOAST.resumed : AVAILABILITY_STATUS_TOAST.paused);
      return queryClient.invalidateQueries({ queryKey: MENTORSHIP_QUERY_KEYS.profile(status.mentorId) });
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? AVAILABILITY_STATUS_TOAST.error);
    },
  });

  const setAvailable = (isAvailable: boolean) => {
    if (!query.data) return;
    mutation.mutate({ mentorId: query.data.mentorId, isAvailable });
  };

  return {
    isAvailable: query.data?.isAvailable ?? false,
    isLoading: query.isPending,
    hasError: query.isError,
    isUpdating: mutation.isPending,
    setAvailable,
  };
}
