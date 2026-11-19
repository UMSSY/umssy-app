import '@/shared/testing/indexed-db.mock';
import { waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { saveAccessToken } from '@/shared/services/storage/access-token-storage';
import { readIndexedDbPair } from '@/shared/services/storage/browser-indexed-db';
import { renderHookWithQuery } from '@/shared/testing/render-hook-with-query';
import { endOfflinePassesSession } from '@/shared/services/storage/offline-passes-owner';
import { offlinePassesStore } from '../utils/offline-passes-store';
import { useOfflinePassesSnapshot } from './use-offline-passes-snapshot';

const pass = {
  id: 'reg-1',
  eventName: 'React',
  date: '2026-11-20',
  startTime: '09:00',
  endTime: '12:00',
  location: 'Aula 101',
  status: 'Confirmada',
  qrToken: 'b'.repeat(64),
};

const token = (sub: string) => `h.${btoa(JSON.stringify({ sub }))}.s`;

describe('useOfflinePassesSnapshot', () => {
  it('loads the saved copy of the current user', async () => {
    await saveAccessToken(token('user-a'));
    await offlinePassesStore.save('user-a', [pass]);
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot(token('user-a'), false),
    );
    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot?.passes).toEqual([pass]);
  });

  it('returns no copy when the user has none', async () => {
    await saveAccessToken(token('user-a'));
    await offlinePassesStore.save('user-a', [pass]);
    await saveAccessToken(token('user-b'));
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot(token('user-b'), false),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toBeNull();
  });

  it('does not read storage for a token without a user', () => {
    vi.mocked(readIndexedDbPair).mockClear();
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot('opaque-token', true),
    );
    expect(result.current).toEqual({ snapshot: null, isLoading: false });
    expect(readIndexedDbPair).not.toHaveBeenCalled();
  });

  it("reads the owner's copy without a token even while the browser reports a connection", async () => {
    await offlinePassesStore.save('user-a', [pass]);
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot(null, true),
    );
    await waitFor(() => expect(result.current.snapshot?.userId).toBe('user-a'));
  });

  it('hides the copy without a token once the offline session was revoked', async () => {
    await offlinePassesStore.save('user-a', [pass]);
    await endOfflinePassesSession('user-a');
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot(null, false),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot).toBeNull();
  });

  it("reads the device owner's copy offline without a session token", async () => {
    await saveAccessToken(token('user-a'));
    await offlinePassesStore.save('user-a', [pass]);
    const { result } = renderHookWithQuery(() =>
      useOfflinePassesSnapshot(null, false),
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.snapshot?.userId).toBe('user-a');
    expect(result.current.snapshot?.passes).toEqual([pass]);
  });

  it('reloads the copy when connectivity changes without flashing a loading state', async () => {
    await saveAccessToken(token('user-a'));
    await offlinePassesStore.save('user-a', [pass]);
    const { result, rerender } = renderHookWithQuery(
      ({ isOnline }: { isOnline: boolean }) =>
        useOfflinePassesSnapshot(token('user-a'), isOnline),
      { initialProps: { isOnline: true } },
    );
    await waitFor(() =>
      expect(result.current.snapshot?.passes).toHaveLength(1),
    );
    await offlinePassesStore.save('user-a', [pass, { ...pass, id: 'reg-2' }]);
    vi.mocked(readIndexedDbPair).mockClear();
    rerender({ isOnline: false });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.snapshot?.passes).toHaveLength(1);
    await waitFor(() =>
      expect(result.current.snapshot?.passes).toHaveLength(2),
    );
    expect(readIndexedDbPair).toHaveBeenCalledWith(
      'offline-passes:owner',
      'offline-passes:user-a',
    );
  });

  it("never shows the previous user's copy while another user loads", async () => {
    await saveAccessToken(token('user-a'));
    await offlinePassesStore.save('user-a', [pass]);
    const { result, rerender } = renderHookWithQuery(
      ({ userId }: { userId: string }) =>
        useOfflinePassesSnapshot(token(userId), false),
      { initialProps: { userId: 'user-a' } },
    );
    await waitFor(() => expect(result.current.snapshot?.userId).toBe('user-a'));
    rerender({ userId: 'user-b' });
    expect(result.current.snapshot).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });
});
