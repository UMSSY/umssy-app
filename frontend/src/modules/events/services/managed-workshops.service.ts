import { apiClient } from '@/shared/services/api-client';
import { getAccessToken } from '@/shared/services/storage/access-token-storage';
import { hasCookieSession } from '@/shared/services/storage/cookie-session-state';
import { BEARER_PREFIX } from '@/shared/constants/auth.constants';
import { readArray, readNullableString, readRecord, readString } from '../utils/response-validation';
import { REQUEST_TIMEOUT_MS } from '../constants/events.constants';
import type { ManagedWorkshop } from '../types/managed-workshop.types';
import { parseRegistrationSessions } from '@/modules/event-registrations';

function parseManagedWorkshop(value: unknown): ManagedWorkshop {
  const row = readRecord(value);
  return {
    id: readString(row.id),
    title: readString(row.title),
    eventDate: readString(row.eventDate),
    startTime: readString(row.startTime),
    endTime: readString(row.endTime),
    location: readNullableString(row.location),
    coverUrl: readNullableString(row.coverUrl),
    ...(row.sessions !== undefined && { sessions: parseRegistrationSessions(row.sessions) }),
  };
}

export const managedWorkshopsService = {
  async getMine(signal?: AbortSignal, accessToken: string | null = getAccessToken()): Promise<ManagedWorkshop[]> {
    if (!accessToken && !hasCookieSession()) throw new Error('Debes iniciar sesión para consultar tus talleres.');
    if (!apiClient.defaults.baseURL) throw new Error('La URL del backend no está configurada.');
    const response = await apiClient.get<unknown>('/events/managed', {
      ...(accessToken ? { headers: { Authorization: `${BEARER_PREFIX}${accessToken}` } } : {}),
      signal,
      timeout: REQUEST_TIMEOUT_MS,
    });
    return readArray(readRecord(response.data).data).map(parseManagedWorkshop);
  },
};
