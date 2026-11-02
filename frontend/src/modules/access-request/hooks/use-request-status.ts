"use client";

import { useCallback, useRef, useState } from "react";
import { accessRequestService } from "../services/access-request.service";
import type { RequestStatusResponse } from "../types/access-request.types";

const FALLBACK_ERROR_MESSAGE =
  "No se pudo consultar la solicitud. Inténtalo de nuevo.";

export function useRequestStatus() {
  const [request, setRequest] = useState<RequestStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const inFlight = useRef(false);

  const lookupRequest = useCallback(async (code: string, email: string) => {
    if (inFlight.current) return;

    inFlight.current = true;
    setIsLoading(true);
    setRequest(null);
    setError(null);
    setErrorStatus(null);

    try {
      const result = await accessRequestService.getRequestStatus(
        code.trim().toUpperCase(),
        email.trim().toLowerCase(),
      );

      if (!result.ok) {
        setError(result.message);
        setErrorStatus(result.status);
        return;
      }

      setRequest(result.data);
    } catch {
      setError(FALLBACK_ERROR_MESSAGE);
      setErrorStatus(0);
    } finally {
      inFlight.current = false;
      setIsLoading(false);
    }
  }, []);

  return {
    request,
    error,
    isLoading,
    isNotFound: errorStatus === 404,
    lookupRequest,
  };
}