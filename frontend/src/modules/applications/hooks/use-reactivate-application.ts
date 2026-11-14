"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JOB_APPLICATION_QUERY_KEYS } from "@/modules/matching";
import { APPLICATION_QUERY_KEYS } from "../constants/application.constants";
import { applicationService } from "../services/application.service";

export function useReactivateApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (applicationId: string) => applicationService.reactivate(applicationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEYS.mine }),
        queryClient.invalidateQueries({ queryKey: JOB_APPLICATION_QUERY_KEYS.minePrefix }),
      ]);
    },
  });

  return {
    reactivate: mutation.mutate,
    reactivateAsync: mutation.mutateAsync,
    reactivatingId: mutation.isPending ? (mutation.variables ?? null) : null,
    hasReactivateError: mutation.isError,
  };
}
