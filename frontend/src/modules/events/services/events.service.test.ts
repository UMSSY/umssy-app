// @vitest-environment node
import '@/shared/testing/indexed-db.mock';
import { AxiosHeaders, type AxiosResponse } from 'axios';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiClient } from '@/shared/services/api-client';
import { clearAccessToken, saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { eventsService } from './events.service';
import type { EventsListResponse } from '../types/event.types';

const MOCK_RESPONSE: EventsListResponse = {
  data: [],
  page: 1,
  offset: 0,
};

const originalBaseUrl = apiClient.defaults.baseURL;

describe('eventsService', () => {
  beforeEach(() => {
    apiClient.defaults.baseURL = 'http://localhost:8080/api';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    clearAccessToken();
    apiClient.defaults.baseURL = originalBaseUrl;
  });

  it('keeps separate offline catalogues for the general list and expired proposals', async () => {
    const token = `h.${btoa(JSON.stringify({ sub: 'user-a' }))}.s`;
    vi.stubGlobal('navigator', { onLine: true });
    await saveAccessToken(token);
    const getSpy = vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce({ data: { data: { items: [] }, page: 1, offset: 0 } })
      .mockResolvedValueOnce({ data: { data: { items: [] }, page: 2, offset: 0 } });
    const general = { page: 1, limit: 50, includeProposals: true };
    const expired = { ...general, statusId: 'expired-status-id' };

    await eventsService.getEvents(general, undefined, token);
    await eventsService.getEvents(expired, undefined, token);
    vi.stubGlobal('navigator', { onLine: false });

    await expect(eventsService.getEvents(general, undefined, token)).resolves.toMatchObject({ page: 1 });
    await expect(eventsService.getEvents(expired, undefined, token)).resolves.toMatchObject({ page: 2 });
    expect(getSpy).toHaveBeenCalledTimes(2);
  });

  it('consulta GET /events con paginacion y devuelve el DTO del backend', async () => {
    const response = {
      data: {
        statusCode: 200,
        ok: true,
        detail: 'Operación exitosa',
        data: { items: MOCK_RESPONSE.data, total: 0, limit: 50, totalPages: 0 },
        page: MOCK_RESPONSE.page,
        offset: MOCK_RESPONSE.offset,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() },
    } as unknown as AxiosResponse<EventsListResponse>;
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce(response);
    const abortController = new AbortController();

    await expect(
      eventsService.getEvents({ page: 1, limit: 50 }, abortController.signal, 'signed-token'),
    ).resolves.toEqual(MOCK_RESPONSE);
    expect(getSpy).toHaveBeenCalledWith('/events', {
      headers: { Authorization: 'Bearer signed-token' },
      params: { page: 1, limit: 50 },
      signal: abortController.signal,
      timeout: 10_000,
    });
  });

  it('sends the requested order to GET /events', async () => {
    const getSpy = vi.spyOn(apiClient, 'get').mockResolvedValueOnce({
      data: { data: { items: [] }, page: 1, offset: 0 },
    } as unknown as AxiosResponse<EventsListResponse>);

    await eventsService.getEvents(
      { page: 1, limit: 50, sort: 'popular' },
      undefined,
      'signed-token',
    );

    expect(getSpy).toHaveBeenCalledWith(
      '/events',
      expect.objectContaining({ params: { page: 1, limit: 50, sort: 'popular' } }),
    );
  });

  it('reads the profile state only when the backend sends it', async () => {
    vi.spyOn(apiClient, 'get')
      .mockResolvedValueOnce({
        data: { data: { items: [], isProfileComplete: false }, page: 1, offset: 0 },
      } as unknown as AxiosResponse<EventsListResponse>)
      .mockResolvedValueOnce({
        data: { data: { items: [], isProfileComplete: 'no' }, page: 1, offset: 0 },
      } as unknown as AxiosResponse<EventsListResponse>);

    await expect(
      eventsService.getEvents({ page: 1, limit: 50, sort: 'recommended' }),
    ).resolves.toEqual({ data: [], page: 1, offset: 0, isProfileComplete: false });
    await expect(
      eventsService.getEvents({ page: 1, limit: 50, sort: 'recommended' }),
    ).resolves.toEqual({ data: [], page: 1, offset: 0 });
  });

  it('falla claramente si falta configurar la URL del backend', async () => {
    apiClient.defaults.baseURL = undefined;

    await expect(
      eventsService.getEvents({ page: 1, limit: 50 }),
    ).rejects.toThrow('La URL del backend no está configurada.');
  });
  it('consults the detail endpoint with cancellation and returns the response data', async () => {
    const detail = {
      id: 'event-1',
      title: 'React',
      category: { id: 'cat-1', name: 'Tecnología' },
      description: null,
      instructorName: null,
      eventDate: '2026-10-20',
      startTime: '09:00',
      endTime: '12:00',
      location: null,
      capacity: 30,
      availableSpots: 20,
      registrationCount: 10,
      statusId: 'published',
      modalityId: 'm1',
      modality: { id: 'm1', title: 'Presencial' },
    };
    const spy = vi
      .spyOn(apiClient, 'get')
      .mockResolvedValue({ data: { data: detail } });
    const signal = new AbortController().signal;
    await expect(eventsService.getEvent('event-1', signal, null)).resolves.toEqual(
      detail,
    );
    expect(spy).toHaveBeenCalledWith('/events/event-1', {
      headers: { Authorization: '' },
      signal,
      timeout: 10000,
    });
  });

  it('rejects detail requests when the backend URL is absent', async () => {
    apiClient.defaults.baseURL = undefined;
    await expect(eventsService.getEvent('event-1')).rejects.toThrow(
      'URL del backend',
    );
  });
});
