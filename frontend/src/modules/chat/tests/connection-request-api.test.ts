
import { beforeEach, describe, expect, it, vi } from 'vitest';

const apiMocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/shared/services/api-client', () => ({
  apiClient: apiMocks,
}));

import {
  sendConnectionRequest,
  getSentConnectionRequests,
  getReceivedConnectionRequests,
} from '../services/connection-request-api';

const request = {
  id: 'request-1',
  senderId: 'user-1',
  receiverId: 'user-2',
  statusId: 'status-1',
  createdAt: '2026-10-28T12:00:00.000Z',
  updatedAt: '2026-10-28T12:00:00.000Z',
  status: {
    id: 'status-1',
    title: 'PENDING' as const,
  },
};

describe('Connection Request API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('envía una solicitud de conexión', async () => {
    apiMocks.post.mockResolvedValue({
      data: {
        statusCode: 201,
        data: request,
      },
    });

    const result = await sendConnectionRequest({
      receiverId: 'user-2',
    });

    expect(apiMocks.post).toHaveBeenCalledWith(
      '/chat/connection-requests',
      { receiverId: 'user-2' },
    );

    expect(result).toEqual(request);
  });

  it('consulta las solicitudes enviadas', async () => {
    apiMocks.get.mockResolvedValue({
      data: {
        statusCode: 200,
        data: [request],
      },
    });

    const result = await getSentConnectionRequests();

    expect(apiMocks.get).toHaveBeenCalledWith(
      '/chat/connection-requests/sent',
    );

    expect(result).toEqual([request]);
  });

  it('consulta las solicitudes recibidas', async () => {
    apiMocks.get.mockResolvedValue({
      data: {
        statusCode: 200,
        data: [request],
      },
    });

    const result = await getReceivedConnectionRequests();

    expect(apiMocks.get).toHaveBeenCalledWith(
      '/chat/connection-requests/received',
    );

    expect(result).toEqual([request]);
  });

  it('admite respuestas sin envoltura del interceptor', async () => {
    apiMocks.get.mockResolvedValue({
      data: [request],
    });

    const result = await getSentConnectionRequests();

    expect(result).toEqual([request]);
  });

  it('propaga errores del backend al enviar solicitudes', async () => {
    apiMocks.post.mockRejectedValue(
      new Error('Ya existe una solicitud pendiente'),
    );

    await expect(
      sendConnectionRequest({ receiverId: 'user-2' }),
    ).rejects.toThrow('Ya existe una solicitud pendiente');
  });
});
