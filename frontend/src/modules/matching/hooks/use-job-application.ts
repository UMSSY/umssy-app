"use client";

import { CONFLICT_STATUS } from "@/shared/constants/http.constants";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef } from "react";
import { isApiError } from "@/shared/services/api-client";
import { JOB_APPLICATION_QUERY_KEYS } from "../constants/job-application.constants";
import { jobApplicationService } from "../services/job-application.service";
import type { MyJobApplication } from "../types/my-job-application.types";
import type { JobApplicationConsents } from "../types/job-application-consents.types";

export function useJobApplication(jobOfferId: string) {
  const queryClient = useQueryClient();
  const submissionPending = useRef(false);
  const queryKey = JOB_APPLICATION_QUERY_KEYS.mine(jobOfferId);

  const query = useQuery({
    queryKey,
    queryFn: () => jobApplicationService.getMine(jobOfferId),
    enabled: !!jobOfferId,
  });

  const mutation = useMutation({
    mutationFn: (consents: JobApplicationConsents) =>
      jobApplicationService.apply(jobOfferId, consents),
    onSuccess: (application) => {
      queryClient.setQueryData<MyJobApplication>(queryKey, {
        hasApplied: true,
        application,
      });
    },
    onError: (error) => {
      if (isApiError(error) && error.response?.status === CONFLICT_STATUS) {
        return queryClient.invalidateQueries({ queryKey });
      }
    },
    onSettled: () => {
      submissionPending.current = false;
    },
  });

  const apply = (consents: JobApplicationConsents) => {
    if (!consents.consent || !consents.consentCv || !consents.consentContact)
      return;
    if (
      submissionPending.current ||
      query.isPending ||
      mutation.isPending ||
      query.data?.hasApplied
    )
      return;
    submissionPending.current = true;
    mutation.mutate(consents);
  };

  return {
    myApplication: query.data,
    isLoading: query.isPending,
    apply,
    isApplying: mutation.isPending,
    applyError:
      mutation.isError &&
      !(
        isApiError(mutation.error) &&
        mutation.error.response?.status === CONFLICT_STATUS
      ),
    submittedApplication: mutation.data ?? null,
    resetSubmission: mutation.reset,
  };
}
