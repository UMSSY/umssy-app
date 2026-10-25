"use client";

import { useQuery } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import { getMentorParticipation } from "../services/mentor-participation.service";

export function useParticipation() {
  const query = useQuery({
    queryKey: ["mentors", "participation"],
    queryFn: async ({ signal }) => {
      try {
        return await getMentorParticipation(signal);
      } catch (error) {
        if (isApiError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
  });
  return {
    state: query.isFetching ? undefined : query.data,
    hasLoadError: query.isError,
    retry: () => {
      void query.refetch();
    },
  };
}
