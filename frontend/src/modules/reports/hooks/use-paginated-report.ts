"use client";

import { useCallback, useEffect, useState } from "react";
import type { ApiResponse, PaginatedData } from "@/shared/types/api-response.types";
import { isConnectionError } from "@/shared/utils/is-connection-error";

// Los reportes se piden al backend en lotes de máximo 10 registros.
export const REPORT_PAGE_SIZE = 10;

// Pasado este tiempo sin respuesta se avisa que la solicitud está tardando demasiado.
export const SLOW_REQUEST_THRESHOLD_MS = 10_000;

export type FetchReportPage<T> = (page: number, limit: number) => Promise<ApiResponse<PaginatedData<T>>>;

interface ReportRequest<T> {
  fetchPage: FetchReportPage<T>;
  page: number;
  refreshCount: number;
}

interface ReportPageState<T> extends ReportRequest<T> {
  result?: PaginatedData<T>;
  errorMessage?: string;
  hasConnectionError?: boolean;
}

function isSameRequest<T>(stored: ReportRequest<T> | null, current: ReportRequest<T>): boolean {
  return (
    stored !== null &&
    stored.fetchPage === current.fetchPage &&
    stored.page === current.page &&
    stored.refreshCount === current.refreshCount
  );
}

// Carga paginada común a las tablas de reportes. `fetchPage` debe venir de useCallback:
// cuando cambian sus filtros cambia la función y se vuelve a consultar la página.
// TODO: migrar a useQuery cuando TanStack Query esté instalado en el proyecto.
export function usePaginatedReport<T>(fetchPage: FetchReportPage<T>, page: number, loadErrorMessage: string) {
  const [state, setState] = useState<ReportPageState<T> | null>(null);
  const [slowRequest, setSlowRequest] = useState<ReportRequest<T> | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);

  useEffect(() => {
    let isCancelled = false;
    const request = { fetchPage, page, refreshCount };

    // No se cancela la petición: solo se avisa la demora y los datos pueden llegar después.
    const slowTimer = setTimeout(() => {
      if (!isCancelled) setSlowRequest(request);
    }, SLOW_REQUEST_THRESHOLD_MS);

    fetchPage(page, REPORT_PAGE_SIZE)
      .then((response) => {
        if (!isCancelled) setState({ ...request, result: response.data });
      })
      .catch((error: unknown) => {
        if (isCancelled) return;
        const hasConnectionError = isConnectionError(error);

        // Sin conexión se conservan los últimos datos cargados para no vaciar la tabla.
        setState((previous) => ({
          ...request,
          result: hasConnectionError ? previous?.result : undefined,
          errorMessage: loadErrorMessage,
          hasConnectionError,
        }));
      })
      .finally(() => clearTimeout(slowTimer));

    return () => {
      isCancelled = true;
      clearTimeout(slowTimer);
    };
  }, [fetchPage, page, refreshCount, loadErrorMessage]);

  const refresh = useCallback(() => setRefreshCount((count) => count + 1), []);

  // Solo se muestran los datos de la consulta vigente: mientras llega la nueva página
  // o el nuevo filtro, la tabla queda en estado de carga.
  const currentRequest = { fetchPage, page, refreshCount };
  const isCurrentRequest = isSameRequest(state, currentRequest);
  const items = isCurrentRequest ? (state?.result?.items ?? []) : [];
  const totalItems = state?.result?.totalItems ?? 0;

  return {
    items,
    totalItems,
    totalPages: Math.max(1, Math.ceil(totalItems / REPORT_PAGE_SIZE)),
    isLoading: !isCurrentRequest,
    // Si se conservaron datos por falta de conexión, la tabla los muestra en lugar del mensaje.
    errorMessage: isCurrentRequest && items.length === 0 ? state?.errorMessage : undefined,
    isSlow: !isCurrentRequest && isSameRequest(slowRequest, currentRequest),
    hasConnectionError: isCurrentRequest && Boolean(state?.hasConnectionError),
    refresh,
  };
}