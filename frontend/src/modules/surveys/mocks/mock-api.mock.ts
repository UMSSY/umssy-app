import { AxiosError, type AxiosResponse } from "axios";
import type { ApiResponse } from "@/shared/types/api-response.types";

// TODO: eliminar con el almacén de ejemplo. Imita las respuestas y errores del backend
// para que los hooks y componentes funcionen igual cuando se conecte la API real.

const MOCK_LATENCY_MS = process.env.NODE_ENV === "test" ? 0 : 300;

export function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS));
}

export function mockResponse<T>(data: T, detail: string, statusCode = 200, page?: number): ApiResponse<T> {
  return { statusCode, ok: true, detail, data, ...(page === undefined ? {} : { page }) };
}

export function mockApiError(statusCode: number, detail: string): AxiosError {
  const response = { status: statusCode, data: { statusCode, ok: false, detail, data: null } } as AxiosResponse;
  return new AxiosError(detail, String(statusCode), undefined, undefined, response);
}
