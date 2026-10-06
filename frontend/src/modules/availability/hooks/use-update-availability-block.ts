"use client";

import { useState } from "react";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { UPDATE_BLOCK_ERROR } from "../constants/availability.constants";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";

export function useUpdateAvailabilityBlock() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateBlock = async (
    id: string,
    input: Partial<CreateAvailabilityBlockInput>,
  ): Promise<AvailabilityBlock | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await availabilityApi.updateAvailabilityBlock(id, input);
    } catch (error) {
      setError(getApiErrorDetail(error) ?? UPDATE_BLOCK_ERROR);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return { updateBlock, isSubmitting, error, clearError };
}
