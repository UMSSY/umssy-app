import { BEARER_PREFIX } from "@/shared/constants/auth.constants";
import { readRecord, readArray } from '@/shared/utils/response-validation';
import { apiClient } from "@/shared/services/api-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { hasCookieSession } from "@/shared/services/storage/cookie-session-state";
import { removeOfflinePassOrDefer } from '@/shared/services/storage/remove-offline-pass';
import { parseApiError } from "@/shared/utils/parse-api-error";
import { parseRegistrationResponse } from "../utils/registration-contract-response";
import { parseRegistration } from "../utils/registration-response";
import type { RegistrationResponse } from "../types/registration-response.types";
import type { Registration } from "../types/registration.types";
import type { FinishedRegistrationsPage } from "../types/finished-registrations-page.types";

import { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';

export const registrationsService = {
  async create(eventId: string, accessToken = getAccessToken()): Promise<RegistrationResponse> {
    const response = await apiClient.post<unknown>("/event-registrations", { eventId }, {
      headers: { Authorization: accessToken ? `${BEARER_PREFIX}${accessToken}` : "" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return parseRegistrationResponse(response.data, 201);
  },

  async getOwn(eventId: string, signal?: AbortSignal, accessToken = getAccessToken()): Promise<RegistrationResponse | null> {
    try {
      const response = await apiClient.get<unknown>(`/events/${encodeURIComponent(eventId)}/registrations/me`, {
        headers: { Authorization: accessToken ? `${BEARER_PREFIX}${accessToken}` : "" },
        signal,
        timeout: REQUEST_TIMEOUT_MS,
      });
      return parseRegistrationResponse(response.data, 200);
    } catch (error) {
      const parsed = parseApiError(error);
      if (parsed?.statusCode === 404 && parsed.code === "REGISTRATION_NOT_FOUND") return null;
      throw error;
    }
  },

  async cancel(registrationId: string, accessToken = getAccessToken()): Promise<RegistrationResponse> {
    const response = await apiClient.delete<unknown>(`/event-registrations/${encodeURIComponent(registrationId)}`, {
      headers: { Authorization: accessToken ? `${BEARER_PREFIX}${accessToken}` : "" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    const registration = parseRegistrationResponse(response.data, 200);
    if (accessToken) await removeOfflinePassOrDefer(registrationId, accessToken);
    return registration;
  },

  async getMine(signal?: AbortSignal, accessToken = getAccessToken()): Promise<Registration[]> {
    const token = accessToken;
    if (!token && !hasCookieSession()) {
      throw new Error("Debes iniciar sesión para ver tus inscripciones.");
    }
    if (!apiClient.defaults.baseURL) {
      throw new Error("La URL del backend no está configurada.");
    }
    const response = await apiClient.get<{ data: Registration[] }>("/event-registrations/me", {
      ...(token ? { headers: { Authorization: `${BEARER_PREFIX}${token}` } } : {}),
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return readArray(readRecord(response.data).data).map(parseRegistration);
  },
  async getFinished(page: number, limit = 10, signal?: AbortSignal, accessToken = getAccessToken()): Promise<FinishedRegistrationsPage> {
    if (!accessToken && !hasCookieSession()) {
      throw new Error("Debes iniciar sesión para ver tus inscripciones.");
    }
    if (!apiClient.defaults.baseURL) throw new Error("La URL del backend no está configurada.");
    const response = await apiClient.get<unknown>("/event-registrations/me", {
      ...(accessToken ? { headers: { Authorization: `${BEARER_PREFIX}${accessToken}` } } : {}),
      params: { scope: "finished", page, limit },
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });
    const envelope = readRecord(response.data);
    const data = readRecord(envelope.data);
    const items = readArray(data.items).map(parseRegistration);
    const total = Number(data.total);
    const totalPages = Number(data.totalPages);
    if (!Number.isSafeInteger(total) || total < 0 || !Number.isSafeInteger(totalPages) || totalPages < 0) {
      throw new Error("La respuesta del historial no es válida.");
    }
    return { items, total, totalPages, limit };
  },
};
