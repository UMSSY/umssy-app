"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { BLOCKED_DATE_TEXT } from "../constants/blocked-date.constants";
import { availabilityApi } from "../services/availability.api";
import type { BlockDateInput } from "../types/block-date-input.types";

export function useBlockDate() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: BlockDateInput) => availabilityApi.blockDate(input),
    onSuccess: () => {
      toast.success(BLOCKED_DATE_TEXT.blocked);
      return queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? BLOCKED_DATE_TEXT.blockError);
    },
  });

  const blockDate = async (input: BlockDateInput): Promise<boolean> => {
    try {
      await mutation.mutateAsync(input);
      return true;
    } catch {
      return false;
    }
  };

  return { blockDate, isBlocking: mutation.isPending };
}
