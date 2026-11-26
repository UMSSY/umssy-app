"use client";

import { useCallback, useRef, useState } from "react";
import {
  COMPANY_LOOKUP_ERROR_MESSAGE,
  COMPANY_RATE_LIMIT_MESSAGE,
} from "../constants/company-request-status.constants";
import { companyAccessRequestService } from "../services/company-access-request.service";
import type { CompanyRequestStatusResponse } from "../types/company-request-status.types";

export function useCompanyRequestStatus() {
  const [request, setRequest] = useState<CompanyRequestStatusResponse | null>(null);
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
      const result = await companyAccessRequestService.getPublicStatus(
        code.trim().toUpperCase(),
        email.trim().toLowerCase(),
      );

      if (!result.ok) {
        setError(
          result.status === 429
            ? COMPANY_RATE_LIMIT_MESSAGE
            : COMPANY_LOOKUP_ERROR_MESSAGE,
        );
        setErrorStatus(result.status);
        return;
      }

      setRequest(result.data);
    } catch {
      setError(COMPANY_LOOKUP_ERROR_MESSAGE);
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
    isRateLimited: errorStatus === 429,
    lookupRequest,
  };
}
