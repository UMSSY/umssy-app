import { readRecord, readArray } from '@/shared/utils/response-validation';
import { apiClient } from "@/shared/services/api-client";
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { parseApiError } from "@/shared/utils/parse-api-error";
import { parseRegistrationResponse } from "../utils/registration-contract-response";
import { parseRegistration } from "../utils/registration-response";
import type { RegistrationResponse } from "../types/registration-response.types";
import type { Registration } from "../types/registration.types";

import { REQUEST_TIMEOUT_MS } from '@/shared/constants/http.constants';

export const registrationsService = {
  async create(eventId: string, accessToken = getAccessToken()): Promise<RegistrationResponse> {
    const response = await apiClient.post<unknown>(`/events/${encodeURIComponent(eventId)}/registrations`, undefined, {
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return parseRegistrationResponse(response.data, 201);
  },

  async getOwn(eventId: string, signal?: AbortSignal, accessToken = getAccessToken()): Promise<RegistrationResponse | null> {
    try {
      const response = await apiClient.get<unknown>(`/events/${encodeURIComponent(eventId)}/registrations/me`, {
        headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
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
    const response = await apiClient.delete<unknown>(`/registrations/${encodeURIComponent(registrationId)}`, {
      headers: { Authorization: accessToken ? `Bearer ${accessToken}` : "" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return parseRegistrationResponse(response.data, 200);
  },

  async getMine(signal?: AbortSignal, accessToken = getAccessToken()): Promise<Registration[]> {
    const token = accessToken;
    if (!token) {
      throw new Error("Debes iniciar sesión para ver tus inscripciones.");
    }
    if (!apiClient.defaults.baseURL) {
      throw new Error("La URL del backend no está configurada.");
    }
    const response = await apiClient.get<{ data: Registration[] }>("/event-registrations/me", {
      headers: { Authorization: `Bearer ${token}` },
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return readArray(readRecord(response.data).data).map(parseRegistration);
  },
};
