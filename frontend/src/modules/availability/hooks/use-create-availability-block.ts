"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { CREATE_BLOCK_ERROR } from "../constants/availability.constants";
import { AVAILABILITY_QUERY_KEYS } from "../constants/availability-query-keys.constants";
import { AVAILABILITY_TOAST_TEXT } from "../constants/availability-toast.constants";
import { availabilityApi } from "../services/availability.api";
import { buildWeeklyRepeatToast } from "../utils/build-weekly-repeat-toast";
import { isWeeklyRepeatResponse } from "../utils/is-weekly-repeat-response";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";
import type { WeeklyRepeatResponse } from "../types/weekly-repeat-response.types";

export function useCreateAvailabilityBlock() {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (input: CreateAvailabilityBlockInput) =>
      availabilityApi.createAvailabilityBlock(input),
    onSuccess: (result) => {
      if (isWeeklyRepeatResponse(result)) {
        const { title, description } = buildWeeklyRepeatToast(result);
        if (result.created === 0) {
          toast.error(title, { description });
        } else {
          toast.success(title, { description });
        }
      } else {
        toast.success(AVAILABILITY_TOAST_TEXT.blockSaved);
      }
      return queryClient.invalidateQueries({ queryKey: AVAILABILITY_QUERY_KEYS.all });
    },
    onError: (error) => {
      toast.error(getApiErrorDetail(error) ?? CREATE_BLOCK_ERROR);
    },
  });

  const createBlock = async (
    input: CreateAvailabilityBlockInput,
  ): Promise<AvailabilityBlock | WeeklyRepeatResponse | null> => {
    try {
      return await mutation.mutateAsync(input);
    } catch {
      return null;
    }
  };

  return { createBlock, isSubmitting: mutation.isPending };
}
