"use client";

import { useState } from "react";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { CREATE_BLOCK_ERROR } from "../constants/availability.constants";
import { availabilityApi } from "../services/availability.api";
import type { AvailabilityBlock } from "../types/availability-block.types";
import type { CreateAvailabilityBlockInput } from "../types/create-availability-block-input.types";

export function useCreateAvailabilityBlock() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createBlock = async (input: CreateAvailabilityBlockInput): Promise<AvailabilityBlock | null> => {
    setIsSubmitting(true);
    setError(null);
    try {
      return await availabilityApi.createAvailabilityBlock(input);
    } catch (error) {
      setError(getApiErrorDetail(error) ?? CREATE_BLOCK_ERROR);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { createBlock, isSubmitting, error };
}
