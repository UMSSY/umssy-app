
import { apiClient } from '@/shared/services/api-client';

import type {
  ConnectionRequest,
  SendConnectionRequestPayload,
} from '../types/connection-request.types';

type ApiResponse<T> =
  | T
  | {
      statusCode: number;
      data: T;
    };

function unwrapResponse<T>(body: ApiResponse<T>): T {
  if (
    body !== null &&
    typeof body === 'object' &&
    'statusCode' in body &&
    'data' in body
  ) {
    return body.data;
  }

  return body as T;
}

export async function sendConnectionRequest(
  payload: SendConnectionRequestPayload,
): Promise<ConnectionRequest> {
  const response = await apiClient.post<
    ApiResponse<ConnectionRequest>
  >('/chat/connection-requests', payload);

  return unwrapResponse(response.data);
}

export async function getSentConnectionRequests(): Promise<
  ConnectionRequest[]
> {
  const response = await apiClient.get<
    ApiResponse<ConnectionRequest[]>
  >('/chat/connection-requests/sent');

  return unwrapResponse(response.data);
}

export async function getReceivedConnectionRequests(): Promise<
  ConnectionRequest[]
> {
  const response = await apiClient.get<
    ApiResponse<ConnectionRequest[]>
  >('/chat/connection-requests/received');

  return unwrapResponse(response.data);
}
