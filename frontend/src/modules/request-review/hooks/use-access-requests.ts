"use client";

import { useEffect, useState } from "react";
import { requestReviewService } from "../services/request-review.service";
import type {
  AccessRequestListPayload,
  AccessRequestListResponse,
} from "../types/request-review.types";

interface RequestState {
  key: string;
  result?: AccessRequestListResponse;
  error?: string;
}

// TODO: migrar a useQuery de TanStack Query cuando se instale en el proyecto
export function useAccessRequests({ status, page, limit }: AccessRequestListPayload) {
  const requestKey = `${status}-${page}-${limit}`;
  const [state, setState] = useState<RequestState | null>(null);

  useEffect(() => {
    let isCancelled = false;

    requestReviewService
      .list({ status, page, limit })
      .then((result) => {
        if (!isCancelled) setState({ key: requestKey, result });
      })
      .catch(() => {
        if (!isCancelled) {
          setState({
            key: requestKey,
            error: "No se pudieron cargar las solicitudes. Intenta de nuevo.",
          });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [requestKey, status, page, limit]);

  const isCurrent = state?.key === requestKey;

  return {
    result: isCurrent ? state.result : undefined,
    error: isCurrent ? state.error : undefined,
    isLoading: !isCurrent,
  };
}