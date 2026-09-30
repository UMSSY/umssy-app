import { isAxiosError } from "axios";

interface ApiErrorBody {
  message?: string | string[];
  errors?: { field: string; message: string }[];
}

const NETWORK_ERROR_MESSAGE =
  "No se pudo conectar con el servidor. Verifica tu conexión e intenta nuevamente.";
const PAYLOAD_TOO_LARGE_MESSAGE = "La fotografía no puede superar los 2 MB.";

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return fallback;
  }
  if (!error.response) {
    return NETWORK_ERROR_MESSAGE;
  }
  if (error.response.status === 413) {
    return PAYLOAD_TOO_LARGE_MESSAGE;
  }

  const message = error.response.data?.message;
  if (typeof message === "string" && message) {
    return message;
  }
  return fallback;
}

export function getApiFieldErrors(error: unknown): Record<string, string> {
  if (!isAxiosError<ApiErrorBody>(error)) {
    return {};
  }

  const errors = error.response?.data?.errors ?? [];
  return Object.fromEntries(errors.map(({ field, message }) => [field, message]));
}
