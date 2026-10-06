"use client";

import { useState } from "react";
import { getApiErrorDetail } from "@/shared/utils/api-error-detail";
import { DELETE_BLOCK_ERROR } from "../constants/delete-block.constants";
import { availabilityApi } from "../services/availability.api";

export function useDeleteBlock() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteBlock = async (id: string): Promise<boolean> => {
    setIsDeleting(true);
    setError(null);
    try {
      await availabilityApi.deleteAvailabilityBlock(id);
      return true;
    } catch (error) {
      setError(getApiErrorDetail(error) ?? DELETE_BLOCK_ERROR);
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const clearError = () => setError(null);

  return { deleteBlock, isDeleting, error, clearError };
}
