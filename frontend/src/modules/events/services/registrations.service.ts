import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { parseRegistration } from '../utils/registration-response';
import { readRecord, readArray } from '../utils/response-validation';
import { REQUEST_TIMEOUT_MS } from '../constants/events.constants';
import { apiClient } from '@/shared/services/api-client';
import type { Registration } from '../types/registration.types';

export interface PassData {
  id: string;
  qrToken: string;
  eventName: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: string;
}

export const registrationsService = {
  async getMine(signal?: AbortSignal): Promise<Registration[]> {
    const token = getAccessToken();
    if (!token)
      throw new Error('Debes iniciar sesión para ver tus inscripciones.');
    if (!apiClient.defaults.baseURL)
      throw new Error('La URL del backend no está configurada.');
    const response = await apiClient.get<{ data: Registration[] }>(
      '/event-registrations/me',
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        timeout: REQUEST_TIMEOUT_MS,
      },
    );
    return readArray(readRecord(response.data).data).map(parseRegistration);
  },

  async getPass(registrationId: string, signal?: AbortSignal): Promise<PassData> {
    const token = getAccessToken();
    if (!token)
      throw new Error('Debes iniciar sesión para consultar el pase.');
    if (!apiClient.defaults.baseURL)
      throw new Error('La URL del backend no está configurada.');

    const response = await apiClient.get(
      `/event-registrations/passes/${registrationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        signal,
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    const passRecord = readRecord(readRecord(response.data).data);

    return {
      id: typeof passRecord.id === 'string' ? passRecord.id : registrationId,
      qrToken: typeof passRecord.qrToken === 'string' ? passRecord.qrToken : '',
      eventName: typeof passRecord.eventName === 'string' ? passRecord.eventName : '',
      date: typeof passRecord.date === 'string' ? passRecord.date : '',
      startTime: typeof passRecord.startTime === 'string' ? passRecord.startTime : '',
      endTime: typeof passRecord.endTime === 'string' ? passRecord.endTime : '',
      location: typeof passRecord.location === 'string' ? passRecord.location : '',
      status: typeof passRecord.status === 'string' ? passRecord.status : '',
    };
  },
};