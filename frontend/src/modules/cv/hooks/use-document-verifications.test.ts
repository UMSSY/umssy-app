import { act, cleanup, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { verificationApi } from '../services/document-verification.service';
import type { DocumentVerification } from '../types/document-verification.types';
import { useDocumentVerifications } from './use-document-verifications';

const session = vi.hoisted(() => ({ currentUserId: null as string | null }));
vi.mock('@/shared/contexts/auth-context', () => ({ useAuth: () => session }));
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
  session.currentUserId = null;
});

describe('Document verification polling', () => {
  it('does not fetch without an owner and isolates history when the signed-in owner changes', async () => {
    const list = vi.spyOn(verificationApi, 'list').mockResolvedValue([]);
    const { result, rerender, client } = renderHookWithQuery(
      useDocumentVerifications,
    );
    expect(list).not.toHaveBeenCalled();
    session.currentUserId = 'owner-a';
    rerender();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(
      client.getQueryData(['documents', 'verifications', 'owner-a']),
    ).toEqual([]);
    session.currentUserId = 'owner-b';
    rerender();
    await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
    expect(
      client.getQueryData(['documents', 'verifications', 'owner-b']),
    ).toEqual([]);
    client.clear();
  });

  it('polls active work promptly and returns to the idle interval after synchronization', async () => {
    session.currentUserId = 'owner';
    const list = vi
      .spyOn(verificationApi, 'list')
      .mockResolvedValue([
        { active: true, synced: false } as DocumentVerification,
      ]);
    const { result, client } = renderHookWithQuery(useDocumentVerifications);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    vi.useFakeTimers();
    list.mockResolvedValue([
      { active: true, synced: true } as DocumentVerification,
    ]);
    await act(async () => {
      await result.current.refetch();
    });
    const count = list.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1500);
    });
    expect(list).toHaveBeenCalledTimes(count);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(13500);
    });
    expect(list).toHaveBeenCalledTimes(count + 1);
    client.clear();
  });
});
