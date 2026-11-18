import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { OFFLINE_PASSES_SNAPSHOT_QUERY_KEY } from '@/shared/constants/offline-passes.constants';
import { useCancelRegistration } from '@/modules/event-registrations/hooks/use-cancel-registration';

const mockGetAccessToken = vi.fn<() => string | null>();
const mockCancelRegistration = vi.fn();

vi.mock('@/shared/services/storage/access-token-storage', () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

vi.mock('@/shared/utils/parse-api-error', () => ({
  parseApiError: (error: unknown) => {
    if (error && typeof error === 'object' && 'code' in error) {
      return { code: String((error as { code: unknown }).code) };
    }
    return null;
  },
}));

vi.mock('@/modules/event-registrations/constants/registration-query-keys.constants', () => ({
  REGISTRATION_QUERY_KEYS: {
    passes: ['registrations', 'passes'],
    list: ['registrations', 'list'],
    detail: (eventId: string) => ['registrations', 'detail', eventId],
    own: (eventId: string, token: string | null) => [
      'registrations',
      'own',
      eventId,
      token,
    ],
  },
}));
vi.mock('@/modules/event-registrations/utils/registration-error', () => ({
  getRegistrationErrorMessage: (error: unknown) =>
    error instanceof Error ? error.message : 'No se pudo cancelar la inscripción',
}));
vi.mock('@/modules/event-registrations/hooks/use-registration-session', () => ({
  useRegistrationSession: () => mockGetAccessToken(),
}));

vi.mock('@/modules/event-registrations/services/registrations.service', () => ({
  registrationsService: {
    cancel: (...args: unknown[]) => mockCancelRegistration(...args),
  },
}));


function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('useCancelRegistration', () => {
  const initialCache = {
    registrations: [
      {
        id: 'reg-1',
        eventId: 'evt-1',
        status: 'confirmed',
        qrToken: 'qr-1',
        createdAt: '2026-11-10T10:00:00.000Z',
      },
      {
        id: 'reg-2',
        eventId: 'evt-2',
        status: 'confirmed',
        qrToken: 'qr-2',
        createdAt: '2026-11-11T10:00:00.000Z',
      },
    ],
    removedSavedPasses: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAccessToken.mockReturnValue('token-user-a');
  });

  it('removes cancelled pass from cache, deletes offline pass and invalidates related queries on success', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const passesKey = ['registrations', 'passes', 'token-user-a'];
    queryClient.setQueryData(passesKey, initialCache);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockCancelRegistration.mockResolvedValue({
      id: 'reg-1',
      eventId: 'evt-1',
      status: 'cancelled',
      qrToken: 'qr-1',
      createdAt: '2026-11-10T10:00:00.000Z',
    });

    const { result } = renderHook(() => useCancelRegistration(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await result.current.cancelRegistration('reg-1');
    });

    expect(mockCancelRegistration).toHaveBeenCalledWith('reg-1', 'token-user-a');

    const updatedCache = queryClient.getQueryData<typeof initialCache>(passesKey);
    expect(updatedCache?.registrations).toHaveLength(1);
    expect(updatedCache?.registrations[0]?.id).toBe('reg-2');

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['registrations', 'passes'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['registrations', 'detail', 'evt-1'],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [OFFLINE_PASSES_SNAPSHOT_QUERY_KEY, 'token-user-a'],
    });
  });

  it('preserves previous passes cache and offline pass when cancellation fails due to server or network error', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const passesKey = ['registrations', 'passes', 'token-user-a'];
    queryClient.setQueryData(passesKey, initialCache);

    mockCancelRegistration.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCancelRegistration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.cancelRegistration('reg-1');
      }),
    ).rejects.toThrow('Network error');

    const preservedCache =
      queryClient.getQueryData<typeof initialCache>(passesKey);
    expect(preservedCache?.registrations).toHaveLength(2);
  });

  it('preserves active cache on REGISTRATION_CLOSED deadline error and invalidates when EVENT_FINISHED', async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const passesKey = ['registrations', 'passes', 'token-user-a'];
    queryClient.setQueryData(passesKey, initialCache);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    mockCancelRegistration.mockRejectedValueOnce({
      code: 'REGISTRATION_CLOSED',
      message: 'El taller ya inició',
    });

    const { result } = renderHook(() => useCancelRegistration(), {
      wrapper: createWrapper(queryClient),
    });

    await expect(
      act(async () => {
        await result.current.cancelRegistration('reg-1');
      }),
    ).rejects.toBeDefined();

    expect(
      queryClient.getQueryData<typeof initialCache>(passesKey)?.registrations,
    ).toHaveLength(2);
    expect(invalidateSpy).not.toHaveBeenCalled();

    mockCancelRegistration.mockRejectedValueOnce({
      code: 'EVENT_FINISHED',
      message: 'El taller ya finalizó',
    });

    await expect(
      act(async () => {
        await result.current.cancelRegistration('reg-1');
      }),
    ).rejects.toBeDefined();

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['registrations', 'passes'],
    });
  });
});
