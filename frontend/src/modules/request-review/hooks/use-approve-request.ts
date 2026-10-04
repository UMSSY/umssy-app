"use client";

import { useState } from "react";
import { isAxiosError } from "axios";
import { requestReviewService } from "../services/request-review.service";
import type { ApproveRequestResponse } from "../types/request-review-types";

const DEFAULT_ERROR_MESSAGE =
  "No se pudo aprobar la solicitud. Intenta de nuevo en unos minutos.";

function getApproveErrorMessage(error: unknown): string {
  if (!isAxiosError(error)) {
    return DEFAULT_ERROR_MESSAGE;
  }
  switch (error.response?.status) {
    case 403:
      return "No tienes permiso para aprobar solicitudes.";
    case 404:
      return "La solicitud ya no existe.";
    case 409:
      return "La solicitud ya no está en revisión, por lo que no se puede aprobar.";
    default:
      return DEFAULT_ERROR_MESSAGE;
  }
}

export function useApproveRequest() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function approve(requestId: string): Promise<ApproveRequestResponse | null> {
    setIsLoading(true);
    setError(null);
    try {
      return await requestReviewService.approveRequest(requestId);
    } catch (caughtError) {
      setError(getApproveErrorMessage(caughtError));
      return null;
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() {
    setError(null);
  }

  return { approve, clearError, isLoading, error };
}
