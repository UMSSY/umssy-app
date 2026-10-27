"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isApiError } from "@/shared/services/api-client";
import { JOB_APPLICATION_QUERY_KEYS } from "../constants/job-application.constants";
import { jobApplicationService } from "../services/job-application.service";
import type { MyJobApplication } from "../types/job-application.types";

const CONFLICT_STATUS = 409;

export function useJobApplication(jobOfferId: string) {
  const queryClient = useQueryClient();
  const queryKey = JOB_APPLICATION_QUERY_KEYS.mine(jobOfferId);

  const query = useQuery({
    queryKey,
    queryFn: () => jobApplicationService.getMine(jobOfferId),
    enabled: !!jobOfferId,
  });

  const mutation = useMutation({
    mutationFn: () => jobApplicationService.apply(jobOfferId),
    onSuccess: (application) => {
      queryClient.setQueryData<MyJobApplication>(queryKey, { hasApplied: true, application });
    },
    onError: (error) => {
      if (isApiError(error) && error.response?.status === CONFLICT_STATUS) {
        return queryClient.invalidateQueries({ queryKey });
      }
    },
  });

  return {
    myApplication: query.data,
    isLoading: query.isPending,
    apply: mutation.mutate,
    isApplying: mutation.isPending,
    applyError: mutation.isError && !(isApiError(mutation.error) && mutation.error.response?.status === CONFLICT_STATUS),
    submittedApplication: mutation.data ?? null,
    resetSubmission: mutation.reset,
  };
}
