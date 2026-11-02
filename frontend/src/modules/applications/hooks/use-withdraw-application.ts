"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { APPLICATION_QUERY_KEYS } from "../constants/application.constants";
import { applicationService } from "../services/application.service";

export function useWithdrawApplication() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (applicationId: string) => applicationService.withdraw(applicationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: APPLICATION_QUERY_KEYS.mine }),
  });

  return {
    withdraw: mutation.mutate,
    withdrawingId: mutation.isPending ? (mutation.variables ?? null) : null,
    hasWithdrawError: mutation.isError,
  };
}
