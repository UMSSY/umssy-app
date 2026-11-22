"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import {
  JOB_ALERT_MESSAGES,
  JOB_ALERT_PREFERENCE_QUERY_KEY,
} from "../constants/job-alert-preference.constants";
import { jobAlertPreferenceService } from "../services/job-alert-preference.service";

export function useJobAlertPreference() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: JOB_ALERT_PREFERENCE_QUERY_KEY,
    queryFn: jobAlertPreferenceService.get,
  });

  const mutation = useMutation({
    mutationFn: jobAlertPreferenceService.update,
    onSuccess: (preference) => {
      queryClient.setQueryData(JOB_ALERT_PREFERENCE_QUERY_KEY, preference);
    },
    
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? JOB_ALERT_MESSAGES.saveError);
      return queryClient.invalidateQueries({ queryKey: JOB_ALERT_PREFERENCE_QUERY_KEY });
    },
  });

  return {
    preference: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
    save: mutation.mutate,
    isSaving: mutation.isPending,
    hasSaved: mutation.isSuccess,
  };
}
