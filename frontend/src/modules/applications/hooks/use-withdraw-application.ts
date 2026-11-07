"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { JOB_APPLICATION_QUERY_KEYS } from "@/modules/matching";
import { APPLICATION_QUERY_KEYS } from "../constants/application.constants";
import { applicationService } from "../services/application.service";

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (applicationId: string) => applicationService.withdraw(applicationId),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEYS.mine }),
        queryClient.invalidateQueries({ queryKey: JOB_APPLICATION_QUERY_KEYS.minePrefix }),
      ]);
    },
  });

  return {
    withdraw: mutation.mutate,
    withdrawingId: mutation.isPending ? (mutation.variables ?? null) : null,
    hasWithdrawError: mutation.isError,
  };
}
