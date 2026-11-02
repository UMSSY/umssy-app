import type { PassData } from '../types/pass-data.types';
export type { PassData } from '../types/pass-data.types';
import { registrationsService as registrationApi } from '@/modules/registrations';
import { getAccessToken } from "@/shared/services/storage/access-token-storage";
import { readRecord, readString, readNullableString } from '../utils/response-validation';
import { REQUEST_TIMEOUT_MS } from '../constants/events.constants';
import { apiClient } from '@/shared/services/api-client';
import { parseProposalSupportResponse } from '../utils/proposal-support-response';
import type { ProposalSupportResponse } from '../types/proposal-support-response.types';


export const registrationsService = {
  getMine: registrationApi.getMine,

  async supportProposal(
    eventId: string,
    accessToken = getAccessToken(),
  ): Promise<ProposalSupportResponse> {
    if (!apiClient.defaults.baseURL)
      throw new Error('La URL del backend no está configurada.');

    const response = await apiClient.post<unknown>(
      `/event-registrations/support/${encodeURIComponent(eventId)}`,
      undefined,
      {
        headers: { Authorization: accessToken ? `Bearer ${accessToken}` : '' },
        timeout: REQUEST_TIMEOUT_MS,
      },
    );

    return parseProposalSupportResponse(response.data, eventId);
  },

  async getPass(registrationId: string, signal?: AbortSignal, accessToken = getAccessToken()): Promise<PassData> {
    const token = accessToken;
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

    const id = readString(passRecord.id);
    const qrToken = readString(passRecord.qrToken);
    const event = readRecord(passRecord.event);
    const status = readString(readRecord(passRecord.status).title);
    if (id !== registrationId || !/^[a-f0-9]{64}$/i.test(qrToken) || status !== 'Confirmada') {
      throw new Error('El pase no contiene una inscripción confirmada con un token QR válido.');
    }
    return {
      id,
      qrToken,
      eventName: readString(event.title),
      date: readString(event.eventDate),
      startTime: readString(event.startTime),
      endTime: readString(event.endTime),
      location: readNullableString(event.location),
      status,
    };
  },
};
