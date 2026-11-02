"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import { availabilityApi } from "../services/availability.service";

export function useUnblockDate() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: string) => availabilityApi.unblockDate(input),
    onSuccess: () => {
      toast.success(BLOCKED_DATE_TEXT.unblocked);
      return queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? BLOCKED_DATE_TEXT.unblockError);
    },
  });

  const unblockDate = async (input: string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(input);
      return true;
    } catch {
      return false;
    }
  };

  return { unblockDate, isUnblocking: mutation.isPending };
}
