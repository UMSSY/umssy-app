"use client";

import { useQuery } from "@tanstack/react-query";
import { mentorParticipationService } from "../services/mentor-participation.service";

export function useParticipation(
  token: string | null,
  refetchOnMount: boolean | "always" = true,
) {
  const query = useQuery({
    queryKey: ["mentors", "participation", token],
    queryFn: ({ signal }) => mentorParticipationService.getMyParticipation(signal),
    enabled: Boolean(token),
    refetchOnMount,
  });
  return {
    state: query.data,
    isFetching: query.isFetching,
    isLoading: query.isPending,
    hasLoadError: query.isError,
    retry: () => { void query.refetch(); },
  };
}
