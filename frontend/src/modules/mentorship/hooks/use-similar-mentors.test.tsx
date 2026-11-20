import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as service from '../services/similar-mentors.service';
import { SIMILAR_MENTORS_FIXTURE } from '../testing/similar-mentors.fixture';
import { MENTORSHIP_QUERY_KEYS } from '../constants/mentorship-query-keys.constants';
import { useSimilarMentors } from './use-similar-mentors';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function setup(mentorId: string, enabled = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  }
  return {
    client,
    ...renderHook(({ id, active }) => useSimilarMentors(id, active), {
      initialProps: { id: mentorId, active: enabled },
      wrapper: Wrapper,
    }),
  };
}

describe('useSimilarMentors', () => {
  it('no consulta si está deshabilitado y consulta al habilitarse', async () => {
    const get = vi.spyOn(service, 'getSimilarMentors').mockResolvedValue([]);
    const { result, rerender } = setup('a', false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(get).not.toHaveBeenCalled();
    rerender({ id: 'a', active: true });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(get).toHaveBeenCalledExactlyOnceWith('a', expect.any(AbortSignal));
  });
  it('separa la caché por mentor y elimina resultados anteriores durante la carga', async () => {
    const first = [SIMILAR_MENTORS_FIXTURE[0]];
    const next = [SIMILAR_MENTORS_FIXTURE[1]];
    let resolveNext!: (value: typeof next) => void;
    vi.spyOn(service, 'getSimilarMentors')
      .mockResolvedValueOnce(first)
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveNext = resolve;
          }),
      );
    const { result, rerender, client } = setup('a');
    await waitFor(() => expect(result.current.data).toEqual(first));
    rerender({ id: 'b', active: true });
    expect(result.current.isPending).toBe(true);
    expect(result.current.data).toBeUndefined();
    await act(async () => resolveNext(next));
    await waitFor(() => expect(result.current.data).toEqual(next));
    expect(client.getQueryData(MENTORSHIP_QUERY_KEYS.similar('a'))).toEqual(
      first,
    );
    expect(client.getQueryData(MENTORSHIP_QUERY_KEYS.similar('b'))).toEqual(
      next,
    );
  });
  it('expone error y permite recuperar mediante refetch', async () => {
    const error = new Error('network');
    const get = vi
      .spyOn(service, 'getSimilarMentors')
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(SIMILAR_MENTORS_FIXTURE);
    const { result } = setup('a');
    await waitFor(() => expect(result.current.error).toBe(error));
    await act(async () => {
      await result.current.refetch();
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(SIMILAR_MENTORS_FIXTURE);
    expect(get).toHaveBeenCalledTimes(2);
  });
});
