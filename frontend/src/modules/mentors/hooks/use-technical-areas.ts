"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getTechnicalAreas } from "@/modules/mentorship";
import { isApiError } from "@/shared/services/api-client";
import { getMentorTechnicalAreas, updateMentorTechnicalAreas } from "../services/technical-areas.service";

export function useTechnicalAreas() {
  const queryClient = useQueryClient();
  const queryKey = ["mentors", "technical-areas"];
  const query = useQuery({
    queryKey,
    retry: false,
    queryFn: async ({ signal }) => {
      const [areas, selected] = await Promise.all([getTechnicalAreas(signal), getMentorTechnicalAreas(signal)]);
      return { areas, savedIds: selected.map(({ id }) => id) };
    },
  });
  const mutation = useMutation({
    mutationFn: (ids: string[]) => updateMentorTechnicalAreas(ids),
    onSuccess: (_data, savedIds) => {
      queryClient.setQueryData<typeof query.data>(queryKey, (current) => current ? { ...current, savedIds } : current);
      void queryClient.invalidateQueries({ queryKey: ["mentors", "participation"] });
      void queryClient.invalidateQueries({ queryKey: ["mentorship", "directory"] });
      void queryClient.invalidateQueries({ queryKey: ["mentorship", "profile"] });
    },
  });
  const status = isApiError(query.error) ? query.error.response?.status : undefined;
  return { areas: query.data?.areas ?? [], savedIds: query.data?.savedIds ?? [], isLoading: query.isPending && query.isFetching,
    hasLoadError: query.isError && ![401, 403, 404].includes(status ?? 0), hasAccessError: query.isError && [401, 403, 404].includes(status ?? 0), isSaving: mutation.isPending, save: mutation.mutateAsync, retry: () => { void query.refetch(); } };
}
