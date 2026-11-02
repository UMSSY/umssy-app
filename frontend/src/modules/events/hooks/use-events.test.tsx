import { renderHookWithQuery as renderHook } from "@/shared/testing/render-hook-with-query";
import { act, cleanup, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useEvents } from './use-events';
import { clearAccessToken, saveAccessToken } from '@/shared/services/storage/access-token-storage';
import type { EventItem, EventsListResponse } from '../types/event.types';

const getEventsMock = vi.hoisted(() => vi.fn());

vi.mock('../services/events.service', () => ({
  eventsService: { getEvents: getEventsMock },
}));

afterEach(() => {
  cleanup();
  clearAccessToken();
});

beforeEach(() => {
  clearAccessToken();
  getEventsMock.mockReset();
});

describe('useEvents', () => {
  it('carga la primera pagina y actualiza el estado', async () => {
    const response: EventsListResponse = {
      data: [],
      page: 1,
      offset: 0,
    };
    getEventsMock.mockResolvedValueOnce(response);

    const { result } = renderHook(() => useEvents());

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(getEventsMock).toHaveBeenCalledWith(
      { page: 1, includeProposals: true, limit: 50 },
      expect.any(AbortSignal),
      null,
    );
    expect(result.current.events).toEqual([]);
    expect(result.current.hasMore).toBe(false);
  });

  it('carga pagina adicional al recibir una pagina completa', async () => {
    const firstPage: EventsListResponse = {
      data: Array.from({ length: 50 }, (_, index) => ({
        id: `event-${index}`,
      })) as EventsListResponse['data'],
      page: 1,
      offset: 0,
    };
    const secondPage: EventsListResponse = {
      data: [
        {
          ...firstPage.data[0],
          id: 'event-50',
        },
      ],
      page: 2,
      offset: 50,
    };
    getEventsMock
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.events).toHaveLength(51));

    expect(getEventsMock).toHaveBeenLastCalledWith(
      { page: 2, includeProposals: true, limit: 50 },
      expect.any(AbortSignal),
      null,
    );
    expect(result.current.hasMore).toBe(false);
  });

  it('keeps loaded pages when the event list is refreshed', async () => {
    const firstPage: EventsListResponse = {
      data: Array.from({ length: 50 }, (_, index) => ({ id: `event-${index}`, availableSpots: 5 })) as EventsListResponse['data'],
      page: 1,
      offset: 0,
    };
    const secondPage: EventsListResponse = {
      data: [{ id: 'event-50', availableSpots: 5 }] as EventsListResponse['data'],
      page: 2,
      offset: 50,
    };
    getEventsMock
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage)
      .mockResolvedValueOnce({ ...firstPage, data: firstPage.data.map((item, index) => index === 0 ? { ...item, availableSpots: 4 } : item) })
      .mockResolvedValueOnce(secondPage);

    const { result, client } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    act(() => result.current.loadMore());
    await waitFor(() => expect(result.current.events).toHaveLength(51));
    await act(async () => { await client.invalidateQueries({ queryKey: ['events', 'list'] }); });
    await waitFor(() => expect(result.current.events[0].availableSpots).toBe(4));
    expect(result.current.events).toHaveLength(51);
    expect(getEventsMock).toHaveBeenCalledTimes(4);
  });

  it('expone error y permite volver a solicitar la primera pagina', async () => {
    getEventsMock
      .mockRejectedValueOnce(new Error('network failure'))
      .mockResolvedValueOnce({ data: [], page: 1, offset: 0 });

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.error).not.toBeNull());

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.error).toBeNull());

    expect(getEventsMock).toHaveBeenCalledTimes(2);
  });

  it('aborta una peticion pendiente al desmontarse', async () => {
    let requestSignal: AbortSignal | undefined;
    getEventsMock.mockImplementationOnce(
      (_params: unknown, signal: AbortSignal) => {
        requestSignal = signal;
        return new Promise(() => {});
      },
    );

    const { unmount } = renderHook(() => useEvents());
    await waitFor(() => expect(requestSignal).toBeDefined());
    unmount();

    expect(requestSignal?.aborted).toBe(true);
  });

  it('separa hasSupported entre la sesión anónima y dos usuarios', async () => {
    getEventsMock.mockImplementation((
      _params: unknown,
      _signal: AbortSignal,
      token: string | null,
    ) => Promise.resolve({
      data: [{ id: 'proposal-1', hasSupported: token === 'token-a' }] as EventItem[],
      page: 1,
      offset: 0,
    }));

    const { result } = renderHook(() => useEvents());
    await waitFor(() => expect(result.current.events[0]?.hasSupported).toBe(false));

    act(() => saveAccessToken('token-a'));
    await waitFor(() => expect(result.current.events[0]?.hasSupported).toBe(true));

    act(() => saveAccessToken('token-b'));
    await waitFor(() => expect(result.current.events[0]?.hasSupported).toBe(false));

    act(() => clearAccessToken());
    await waitFor(() => expect(result.current.events[0]?.hasSupported).toBe(false));

    expect(getEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({ includeProposals: true }),
      expect.any(AbortSignal),
      'token-a',
    );
    expect(getEventsMock).toHaveBeenCalledWith(
      expect.objectContaining({ includeProposals: true }),
      expect.any(AbortSignal),
      'token-b',
    );
  });
});
